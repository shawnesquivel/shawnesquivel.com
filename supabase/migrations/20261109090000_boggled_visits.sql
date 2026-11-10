-- Word Brawl dashboard: visits vs unique visitors. A visit is a run of events from one browser tab with no
-- gap longer than 30 minutes, so someone who opens the game in the morning and again at night counts as
-- 1 visitor with 2 visits that day. Works on all existing events. Answers only to the server's secret key.
-- Safe to re-run.

create or replace function public.boggled_visits(days integer default 30, tz text default 'UTC')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with ev as (
  select player, session, at,
    lag(at) over (partition by player, session order by at) as prev
  from boggled_events
  where at >= now() - make_interval(days => greatest(1, least(boggled_visits.days, 365)))
),
visits as (
  select player, at, (at at time zone boggled_visits.tz)::date as day
  from ev
  where prev is null or at - prev > interval '30 minutes'
),
per_day as (
  select day, count(distinct player) as visitors, count(*) as visits
  from visits group by day
),
per_player_day as (
  select player, day, count(*) as n from visits group by player, day
),
per_player as (
  select player, count(*) as n from visits group by player
)
select jsonb_build_object(
  'visitors', (select count(distinct player) from visits),
  'visits', (select count(*) from visits),
  'repeat_days', (select count(*) from per_player_day where n >= 2),
  'player_days', (select count(*) from per_player_day),
  'daily', (
    select coalesce(jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'visits', visits) order by day), '[]'::jsonb)
    from per_day
  ),
  'per_visitor', (
    select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'players', players) order by ord), '[]'::jsonb)
    from (
      select
        case when n = 1 then '1' when n = 2 then '2' when n = 3 then '3' when n <= 5 then '4–5' else '6+' end as bucket,
        min(least(n, 6)) as ord,
        count(*) as players
      from per_player group by 1
    ) b
  )
);
$$;

revoke all on function public.boggled_visits(integer, text) from public, anon, authenticated;
grant execute on function public.boggled_visits(integer, text) to service_role;
