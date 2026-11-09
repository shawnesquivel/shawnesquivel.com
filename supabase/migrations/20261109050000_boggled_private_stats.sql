-- Word Brawl analytics: make the dashboard data private and add visitor locations.
-- After this runs, boggled_stats / boggled_places only answer to the server's secret key
-- (service_role), so set SUPABASE_SECRET_KEY on Vercel first. boggled_daily_rank stays public:
-- the game calls it from the browser for "you beat X% of players".

revoke execute on function public.boggled_stats(integer) from anon, authenticated;
grant execute on function public.boggled_stats(integer) to service_role;

-- Where players are, from the country / region / city on session_start (no IPs are stored).
-- Each player counts once, at their most recent location in the window.
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
    nullif(props->>'city', '') as city
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
  )
);
$$;

revoke all on function public.boggled_places(integer) from public, anon, authenticated;
grant execute on function public.boggled_places(integer) to service_role;
