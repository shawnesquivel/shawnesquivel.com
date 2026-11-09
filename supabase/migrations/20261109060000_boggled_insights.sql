-- Word Brawl dashboard insights: map points for boggled_places, and boggled_insights (groups,
-- replayability, feature adoption, weekly rhythm). Both answer only to the server's secret key.
-- Safe to re-run.

-- Where players are, from the country / region / city / rounded lat-lon on session_start (no IPs
-- are stored). Each player counts once, at their most recent location in the window.
create or replace function public.boggled_places(days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with latest as (
  select distinct on (player)
    player,
    props->>'country' as country,
    nullif(props->>'region', '') as region,
    nullif(props->>'city', '') as city,
    round((props->>'lat')::numeric, 1) as lat,
    round((props->>'lon')::numeric, 1) as lon
  from boggled_events
  where event = 'session_start'
    and props ? 'country'
    and at >= now() - make_interval(days => greatest(1, least(boggled_places.days, 365)))
  order by player, at desc
)
select jsonb_build_object(
  'located', (select count(*) from latest),
  'countries', (
    select coalesce(jsonb_agg(jsonb_build_object('country', country, 'players', n) order by n desc), '[]'::jsonb)
    from (select country, count(*) as n from latest group by 1 order by 2 desc limit 25) x
  ),
  'cities', (
    select coalesce(jsonb_agg(jsonb_build_object('city', city, 'region', region, 'country', country, 'players', n) order by n desc), '[]'::jsonb)
    from (select city, region, country, count(*) as n from latest where city is not null group by 1, 2, 3 order by 4 desc limit 25) x
  ),
  'points', (
    select coalesce(jsonb_agg(jsonb_build_object('lat', lat, 'lon', lon, 'label', label, 'players', n) order by n desc), '[]'::jsonb)
    from (
      select lat, lon, min(coalesce(city || ', ', '') || country) as label, count(*) as n
      from latest where lat is not null and lon is not null group by 1, 2 order by 4 desc limit 300
    ) x
  )
);
$$;

revoke all on function public.boggled_places(integer) from public, anon, authenticated;
grant execute on function public.boggled_places(integer) to service_role;

-- Groups (room rounds tagged with their room code), replayability (return rates, play-again
-- rates, stickiness per mode), feature adoption and when people play.
create or replace function public.boggled_insights(days integer default 30, tz text default 'Asia/Bangkok')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with ev as (
  select * from boggled_events where at >= now() - make_interval(days => greatest(1, least(boggled_insights.days, 365)))
),
starts as (select * from ev where event = 'round_start'),
ends as (select * from ev where event = 'round_end'),
-- First day each player was ever seen, for players first seen inside the window.
cohort as (
  select player, d0 from (
    select player, min((at at time zone 'utc')::date) as d0 from boggled_events
    where player in (select distinct player from ev) group by player
  ) f
  where d0 >= (now() at time zone 'utc')::date - greatest(1, least(boggled_insights.days, 365))
),
active as (
  select distinct e.player, (e.at at time zone 'utc')::date as d
  from boggled_events e join cohort c using (player)
),
today as (select (now() at time zone 'utc')::date as d),
rooms as (
  select
    props->>'room' as room,
    max((props->>'players')::int) as size,
    count(*) filter (where (props->>'host')::boolean) as rounds,
    count(distinct player) as members,
    count(distinct (at at time zone 'utc')::date) as days
  from starts
  where props->>'mode' = 'room' and coalesce(props->>'room', '') <> ''
  group by 1
),
-- A room's play session = first to last round on one day (the same code can be reused later).
room_nights as (
  select props->>'room' as room, extract(epoch from max(at) - min(at)) as secs, count(*) filter (where (props->>'host')::boolean) as rounds
  from starts
  where props->>'mode' = 'room' and coalesce(props->>'room', '') <> ''
  group by 1, (at at time zone 'utc')::date
),
feature_list(key, ord) as (
  values ('story', 1), ('daily', 2), ('rooms', 3), ('practice', 4), ('survival', 5),
         ('create_room', 6), ('join_link', 7), ('invite', 8), ('rematch', 9), ('howto', 10),
         ('attack', 11), ('combo', 12), ('react', 13), ('blast', 14), ('shop', 15), ('item', 16),
         ('ad', 17), ('daily_collect', 18), ('skip_reveal', 19), ('room_settings', 20),
         ('rename', 21), ('installed', 22)
),
feature_use as (
  select case
      when event = 'round_start' then case props->>'mode'
        when 'quick' then 'story' when 'daily' then 'daily' when 'room' then 'rooms'
        when 'practice' then 'practice' when 'survival' then 'survival' end
      when event = 'click' then case
        when props->>'target' = 'create_room' then 'create_room'
        when props->>'target' in ('share_link', 'copy_code', 'qr') then 'invite'
        when props->>'target' in ('rematch', 'play_again', 'next_game') then 'rematch'
        when props->>'target' in ('daily_collect', 'skip_reveal', 'rename') then props->>'target' end
      when event = 'screen' and screen = 'join_name' then 'join_link'
      when event = 'howto' then 'howto'
      when event = 'attack' then case when props->>'weapon' = 'blast' then 'blast' else 'attack' end
      when event in ('combo', 'item') then event
      when event = 'react' then 'react'
      when event = 'buy' then 'shop'
      when event = 'ad_start' then 'ad'
      when event = 'setting' then 'room_settings'
      when event = 'session_start' and (props->>'standalone')::boolean then 'installed'
    end as key,
    player
  from ev
)
select jsonb_build_object(
  'tz', boggled_insights.tz,
  'players', (select count(distinct player) from ev),
  'retention', (
    select coalesce(jsonb_agg(jsonb_build_object('day', k, 'eligible', eligible, 'on_day', on_day, 'within', within) order by k), '[]'::jsonb)
    from (
      select k,
        count(*) as eligible,
        count(*) filter (where exists (select 1 from active a where a.player = c.player and a.d = c.d0 + k)) as on_day,
        count(*) filter (where exists (select 1 from active a where a.player = c.player and a.d > c.d0 and a.d <= c.d0 + k)) as within
      from cohort c cross join unnest(array[1, 2, 3, 7, 14]) as k, today
      where c.d0 + k <= today.d
      group by k
    ) r
  ),
  'active_days', (
    select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'players', n) order by ord), '[]'::jsonb) from (
      select
        case when d = 1 then '1 day' when d = 2 then '2 days' when d = 3 then '3 days' when d <= 6 then '4–6 days' else '7+ days' end as bucket,
        case when d <= 3 then d when d <= 6 then 4 else 5 end as ord, count(*) as n
      from (select player, count(distinct (at at time zone 'utc')::date) as d from ev group by player) p
      group by 1, 2
    ) x
  ),
  'modes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'mode', mode, 'players', players, 'repeat_players', repeat_players, 'return_players', return_players,
      'rounds', rounds, 'ends', coalesce(ended, 0), 'again', coalesce(again, 0)) order by rounds desc), '[]'::jsonb)
    from (
      select mode, count(*) as players, sum(n) as rounds,
        count(*) filter (where n >= 2) as repeat_players, count(*) filter (where d >= 2) as return_players
      from (
        select props->>'mode' as mode, player, count(*) as n, count(distinct (at at time zone 'utc')::date) as d
        from starts group by 1, 2
      ) pm group by 1
    ) m
    left join (
      select props->>'mode' as mode, count(*) as ended,
        count(*) filter (where exists (select 1 from starts s where s.session = e.session and s.at > e.at)) as again
      from ends e group by 1
    ) a using (mode)
  ),
  'groups', (
    select jsonb_build_object(
      'groups', count(*),
      'avg_size', round(avg(size), 1),
      'avg_rounds', round(avg(rounds), 1),
      'replayed', count(*) filter (where rounds >= 2),
      'marathon', count(*) filter (where rounds >= 5),
      'returned', count(*) filter (where days >= 2),
      'avg_secs', (select round(avg(secs)) from room_nights where rounds >= 2),
      'sizes', (
        select coalesce(jsonb_agg(jsonb_build_object('size', size, 'groups', n) order by size), '[]'::jsonb)
        from (select size, count(*) as n from rooms group by 1) s
      ),
      'rounds_dist', (
        select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'groups', n) order by ord), '[]'::jsonb) from (
          select case when rounds <= 1 then '1 round' when rounds <= 3 then '2–3 rounds' when rounds <= 9 then '4–9 rounds' else '10+ rounds' end as bucket,
            case when rounds <= 1 then 1 when rounds <= 3 then 2 when rounds <= 9 then 3 else 4 end as ord, count(*) as n
          from rooms group by 1, 2
        ) b
      )
    ) from rooms
  ),
  'invites', (
    select jsonb_build_object(
      'create_clicks', count(*) filter (where event = 'click' and props->>'target' = 'create_room'),
      'creators', count(distinct player) filter (where event = 'click' and props->>'target' = 'create_room'),
      'share_link', count(*) filter (where event = 'click' and props->>'target' = 'share_link'),
      'copy_code', count(*) filter (where event = 'click' and props->>'target' = 'copy_code'),
      'qr', count(*) filter (where event = 'click' and props->>'target' = 'qr'),
      'joined_by_link', count(distinct player) filter (where event = 'screen' and screen = 'join_name'),
      'joined_by_code', count(distinct player) filter (where event = 'click' and props->>'target' = 'join_room')
    ) from ev
  ),
  'features', (
    select jsonb_agg(jsonb_build_object('key', f.key, 'players', coalesce(u.players, 0), 'uses', coalesce(u.uses, 0)) order by f.ord)
    from feature_list f
    left join (select key, count(distinct player) as players, count(*) as uses from feature_use where key is not null group by key) u using (key)
  ),
  'hours', (
    select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', h, 'rounds', n)), '[]'::jsonb) from (
      select extract(isodow from at at time zone boggled_insights.tz)::int as dow, extract(hour from at at time zone boggled_insights.tz)::int as h, count(*) as n
      from starts group by 1, 2
    ) x
  )
);
$$;

revoke all on function public.boggled_insights(integer, text) from public, anon, authenticated;
grant execute on function public.boggled_insights(integer, text) to service_role;
