-- Word Brawl (Boggled) gameplay analytics. Anonymous, insert-only from the browser;
-- reads go through aggregate functions only. See docs/boggled/analytics.md.

create table if not exists public.boggled_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  player text not null check (char_length(player) between 6 and 32),
  session text not null check (char_length(session) between 6 and 32),
  event text not null check (event ~ '^[a-z_]{2,32}$'),
  screen text check (char_length(screen) <= 32),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2048)
);

create index if not exists boggled_events_at_idx on public.boggled_events (at);
create index if not exists boggled_events_session_idx on public.boggled_events (session, at);

alter table public.boggled_events enable row level security;

drop policy if exists "anyone can log game events" on public.boggled_events;
create policy "anyone can log game events" on public.boggled_events
  for insert to anon, authenticated
  with check (at between now() - interval '5 minutes' and now() + interval '1 minute');

revoke all on public.boggled_events from anon, authenticated;
grant insert on public.boggled_events to anon, authenticated;

create or replace function public.boggled_stats(days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with ev as (
  select * from boggled_events where at >= now() - make_interval(days => greatest(1, least(boggled_stats.days, 365)))
),
sessions as (
  select
    session,
    min(player) as player,
    min(at) as started,
    max(at) as ended,
    count(*) filter (where event = 'round_start') as rounds,
    (array_agg(screen order by at desc, id desc))[1] as exit_screen
  from ev group by session
),
players as (
  select
    player,
    count(distinct session) as sessions,
    count(*) filter (where event = 'round_start') as rounds,
    count(*) filter (where event = 'round_end') as finished,
    count(distinct (at at time zone 'utc')::date) as days
  from ev group by player
),
play_time as (
  select player, sum(extract(epoch from ended - started)) as secs from sessions group by player
),
starts as (select * from ev where event = 'round_start'),
ends as (select * from ev where event = 'round_end')
select jsonb_build_object(
  'days', boggled_stats.days,
  'generated_at', now(),
  'players', (select count(*) from players),
  'sessions', (select count(*) from sessions),
  'rounds_started', (select count(*) from starts),
  'rounds_finished', (select count(*) from ends),
  'returning_players', (select count(*) from players where days >= 2),
  'avg_rounds_per_player', (select round(avg(rounds), 2) from players),
  'avg_rounds_per_session', (select round(avg(rounds), 2) from sessions),
  'median_session_secs', (select round(percentile_cont(0.5) within group (order by extract(epoch from ended - started))::numeric) from sessions),
  'avg_session_secs', (select round(avg(extract(epoch from ended - started))::numeric) from sessions),
  'avg_play_secs_per_player', (select round(avg(secs)::numeric) from play_time),
  'rounds_per_player', (
    select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'players', n) order by ord), '[]'::jsonb) from (
      select
        case when rounds = 0 then '0' when rounds = 1 then '1' when rounds <= 3 then '2–3' when rounds <= 9 then '4–9' else '10+' end as bucket,
        case when rounds = 0 then 0 when rounds = 1 then 1 when rounds <= 3 then 2 when rounds <= 9 then 3 else 4 end as ord,
        count(*) as n
      from players group by 1, 2
    ) b
  ),
  'funnel', jsonb_build_array(
    jsonb_build_object('step', 'Opened the game', 'players', (select count(*) from players)),
    jsonb_build_object('step', 'Started a round', 'players', (select count(*) from players where rounds > 0)),
    jsonb_build_object('step', 'Finished a round', 'players', (select count(*) from players where finished > 0)),
    jsonb_build_object('step', 'Played 2+ rounds', 'players', (select count(*) from players where rounds >= 2)),
    jsonb_build_object('step', 'Came back another day', 'players', (select count(*) from players where days >= 2))
  ),
  'exits', (
    select coalesce(jsonb_agg(jsonb_build_object('screen', coalesce(exit_screen, 'unknown'), 'sessions', n) order by n desc), '[]'::jsonb)
    from (select exit_screen, count(*) as n from sessions group by 1) x
  ),
  'daily', (
    select coalesce(jsonb_agg(jsonb_build_object('day', d, 'players', p, 'rounds', r) order by d), '[]'::jsonb) from (
      select (at at time zone 'utc')::date as d, count(distinct player) as p, count(*) filter (where event = 'round_start') as r
      from ev group by 1
    ) x
  ),
  'modes', (
    select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'rounds', r, 'players', p, 'finished', f) order by r desc), '[]'::jsonb) from (
      select s.mode, s.r, s.p, coalesce(e.f, 0) as f
      from (select props->>'mode' as mode, count(*) as r, count(distinct player) as p from starts group by 1) s
      left join (select props->>'mode' as mode, count(*) as f from ends group by 1) e using (mode)
    ) x
  ),
  'room_settings', (
    select jsonb_build_object(
      'size', (select jsonb_object_agg(k, n) from (select props->>'size' as k, count(*) as n from starts where props->>'mode' = 'room' group by 1) x where k is not null),
      'duration', (select jsonb_object_agg(k, n) from (select props->>'duration' as k, count(*) as n from starts where props->>'mode' = 'room' group by 1) x where k is not null),
      'no_chill', (select jsonb_object_agg(k, n) from (select props->>'no_chill' as k, count(*) as n from starts where props->>'mode' = 'room' group by 1) x where k is not null),
      'series', (select jsonb_object_agg(k, n) from (select props->>'series' as k, count(*) as n from starts where props->>'mode' = 'room' group by 1) x where k is not null),
      'min', (select jsonb_object_agg(k, n) from (select props->>'min' as k, count(*) as n from starts where props->>'mode' = 'room' group by 1) x where k is not null),
      'players', (select jsonb_object_agg(k, n) from (select props->>'players' as k, count(*) as n from starts where props->>'mode' = 'room' and (props->>'host')::boolean group by 1) x where k is not null)
    )
  ),
  'setting_changes', (
    select coalesce(jsonb_agg(jsonb_build_object('key', k, 'value', v, 'n', n) order by n desc), '[]'::jsonb) from (
      select props->>'key' as k, props->>'value' as v, count(*) as n from ev where event = 'setting' group by 1, 2 order by 3 desc limit 20
    ) x
  ),
  'clicks', (
    select coalesce(jsonb_agg(jsonb_build_object('target', t, 'n', n, 'players', p) order by n desc), '[]'::jsonb) from (
      select props->>'target' as t, count(*) as n, count(distinct player) as p from ev where event = 'click' group by 1
    ) x
  ),
  'features', jsonb_build_object(
    'attacks', (select count(*) from ev where event = 'attack'),
    'combos', (select count(*) from ev where event = 'combo'),
    'reactions', (select count(*) from ev where event = 'react'),
    'howto_opens', (select count(*) from ev where event = 'howto'),
    'howto_finished', (select count(*) from ev where event = 'howto' and (props->>'slide')::int >= (props->>'of')::int)
  ),
  'bot', (
    select coalesce(jsonb_agg(jsonb_build_object('level', lvl, 'rounds', n, 'player_wins', w) order by lvl), '[]'::jsonb) from (
      select (props->>'bot_level')::int as lvl, count(*) as n, count(*) filter (where props->>'bot' = 'win') as w
      from ends where props->>'mode' = 'quick' and props ? 'bot_level' group by 1
    ) x
  ),
  'survival', (
    select jsonb_build_object('rounds', count(*), 'avg_survived_secs', round(avg((props->>'survived')::numeric)), 'best_survived_secs', max((props->>'survived')::numeric))
    from ends where props->>'mode' = 'survival'
  ),
  'daily_puzzle', (
    select jsonb_build_object('plays', count(*), 'first_plays', count(*) filter (where (props->>'first')::boolean), 'avg_first_score', round(avg((props->>'score')::numeric) filter (where (props->>'first')::boolean), 1))
    from ends where props->>'mode' = 'daily'
  ),
  'referrers', (
    select coalesce(jsonb_agg(jsonb_build_object('ref', r, 'sessions', n) order by n desc), '[]'::jsonb) from (
      select coalesce(nullif(props->>'ref', ''), 'direct') as r, count(*) as n from ev where event = 'session_start' group by 1 order by 2 desc limit 10
    ) x
  ),
  'devices', (
    select jsonb_build_object(
      'mobile', count(*) filter (where (props->>'mobile')::boolean),
      'desktop', count(*) filter (where not coalesce((props->>'mobile')::boolean, false)),
      'installed', count(*) filter (where (props->>'standalone')::boolean)
    ) from ev where event = 'session_start'
  )
);
$$;

-- "You beat X% of today's players" for the Daily Puzzle (first plays only).
create or replace function public.boggled_daily_rank(day text, score integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with firsts as (
    select distinct on (player) player, (props->>'score')::int as s
    from boggled_events
    where event = 'round_end' and props->>'mode' = 'daily' and props->>'day' = boggled_daily_rank.day and (props->>'first')::boolean
      and at >= now() - interval '3 days'
    order by player, at
  )
  select jsonb_build_object(
    'players', count(*),
    'beaten', count(*) filter (where s < boggled_daily_rank.score),
    'top', max(s)
  ) from firsts;
$$;

revoke all on function public.boggled_stats(integer) from public;
revoke all on function public.boggled_daily_rank(text, integer) from public;
grant execute on function public.boggled_stats(integer) to anon, authenticated;
grant execute on function public.boggled_daily_rank(text, integer) to anon, authenticated;
