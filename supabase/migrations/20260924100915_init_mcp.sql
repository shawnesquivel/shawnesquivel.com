-- Clients hold API keys. Only the SHA-256 hash of a key is stored.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  api_key_hash text not null unique check (api_key_hash ~ '^[a-f0-9]{64}$'),
  api_key_prefix text not null,
  daily_request_limit integer check (daily_request_limit > 0),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

comment on column public.clients.daily_request_limit is 'Overrides DEVREL_DAILY_REQUEST_LIMIT for this client. Null uses the default.';
comment on column public.clients.revoked_at is 'Set to revoke the API key.';

create table public.requests (
  id text primary key check (id ~ '^req_[a-f0-9]{16}$'),
  client_id uuid not null references public.clients (id) on delete cascade,
  type text not null check (type in ('blog', 'article', 'shortform', 'longform', 'thread', 'cookbook')),
  title text not null check (char_length(title) between 3 and 140),
  brief text check (char_length(brief) <= 2000),
  audience text not null check (audience in ('beginner', 'intermediate', 'advanced')),
  priority text not null check (priority in ('normal', 'rush')),
  links text[] not null default '{}' check (cardinality(links) <= 10),
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'in_review', 'shipped', 'cancelled')),
  deliverable_url text,
  estimated_delivery timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.requests.status is 'Update as work progresses: queued, in_progress, in_review, shipped, cancelled.';
comment on column public.requests.deliverable_url is 'Link to the finished piece. Clients see it through get_request.';

create index requests_client_created_idx on public.requests (client_id, created_at desc);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

-- RLS on with no policies: anon and authenticated roles get nothing; only the server's secret key can access.
alter table public.clients enable row level security;
alter table public.requests enable row level security;
