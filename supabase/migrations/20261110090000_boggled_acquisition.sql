-- Word Brawl dashboard: where visits come from. Channels (search, social, invite links, campaigns, referral,
-- direct), top sources, UTM campaigns, landing pages and guide-page performance, each with how many of
-- those sessions went on to play a round. Answers only to the server's secret key. Safe to re-run.

create or replace function public.boggled_source_of(ref text, utm text)
returns text
language sql
immutable
as $$
  select case
    when nullif(utm, '') is not null then lower(utm)
    when coalesce(ref, '') = '' then 'direct'
    when ref ~ '(^|\.)google\.' then 'google'
    when ref ~ '(^|\.)bing\.com$' then 'bing'
    when ref ~ '(^|\.)duckduckgo\.com$' then 'duckduckgo'
    when ref ~ '(^|\.)(search\.)?yahoo\.' then 'yahoo'
    when ref ~ '(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)$' then 'ai'
    when ref ~ '(^|\.)reddit\.com$' then 'reddit'
    when ref ~ '(^|\.)(facebook\.com|fb\.com|messenger\.com)$' then 'facebook'
    when ref ~ '(^|\.)(t\.co|twitter\.com|x\.com)$' then 'x'
    when ref ~ '(^|\.)instagram\.com$' then 'instagram'
    when ref ~ '(^|\.)tiktok\.com$' then 'tiktok'
    when ref ~ '(^|\.)(youtube\.com|youtu\.be)$' then 'youtube'
    else regexp_replace(ref, '^www\.', '')
  end;
$$;

create or replace function public.boggled_acquisition(days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with win as (
  select * from boggled_events
  where at >= now() - make_interval(days => greatest(1, least(boggled_acquisition.days, 365)))
),
starts as (
  select distinct on (session)
    session, player,
    boggled_source_of(props->>'ref', props->>'utm') as source,
    nullif(props->>'utm', '') as utm,
    nullif(props->>'utm_medium', '') as medium,
    nullif(props->>'utm_campaign', '') as campaign,
    coalesce(nullif(props->>'landing', ''), '/') as landing
  from win where event = 'session_start'
  order by session, at
),
played as (select distinct session from win where event = 'round_start'),
s as (
  select st.*,
    (p.session is not null) as played,
    case
      when st.utm = 'invite' then 'invite'
      when st.utm is not null then 'campaign'
      when st.source in ('google', 'bing', 'duckduckgo', 'yahoo') then 'search'
      when st.source = 'ai' then 'ai'
      when st.source in ('reddit', 'facebook', 'x', 'instagram', 'tiktok', 'youtube') then 'social'
      when st.source = 'direct' then 'direct'
      else 'referral'
    end as channel
  from starts st left join played p using (session)
),
art as (
  select props->>'slug' as slug, session, event from win
  where event in ('article_view', 'article_read', 'article_cta') and props ? 'slug'
)
select jsonb_build_object(
  'sessions', (select count(*) from s),
  'channels', (
    select coalesce(jsonb_agg(jsonb_build_object('channel', channel, 'sessions', n, 'players', pl, 'played', pd) order by n desc), '[]'::jsonb)
    from (select channel, count(*) n, count(distinct player) pl, count(*) filter (where played) pd from s group by 1) x
  ),
  'sources', (
    select coalesce(jsonb_agg(jsonb_build_object('source', source, 'sessions', n, 'played', pd) order by n desc), '[]'::jsonb)
    from (select source, count(*) n, count(*) filter (where played) pd from s group by 1 order by 2 desc limit 15) x
  ),
  'campaigns', (
    select coalesce(jsonb_agg(jsonb_build_object('source', utm, 'medium', medium, 'campaign', campaign, 'sessions', n, 'played', pd) order by n desc), '[]'::jsonb)
    from (select utm, medium, campaign, count(*) n, count(*) filter (where played) pd from s where utm is not null group by 1, 2, 3 order by 4 desc limit 15) x
  ),
  'landings', (
    select coalesce(jsonb_agg(jsonb_build_object('landing', landing, 'sessions', n, 'played', pd) order by n desc), '[]'::jsonb)
    from (select landing, count(*) n, count(*) filter (where played) pd from s group by 1 order by 2 desc limit 15) x
  ),
  'articles', (
    select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'views', v, 'readers', r, 'clicked', c, 'played', pd) order by v desc), '[]'::jsonb)
    from (
      select a.slug,
        count(*) filter (where a.event = 'article_view') v,
        count(distinct a.session) filter (where a.event = 'article_read') r,
        count(distinct a.session) filter (where a.event = 'article_cta') c,
        count(distinct a.session) filter (where a.event = 'article_view' and p.session is not null) pd
      from art a left join played p using (session)
      group by 1
    ) x
  )
);
$$;

revoke all on function public.boggled_acquisition(integer) from public, anon, authenticated;
grant execute on function public.boggled_acquisition(integer) to service_role;
