alter table to_eat_items
  add column if not exists source_share_token text references shared_restaurant_links(token) on delete set null;

create table if not exists share_events (
  id uuid primary key default gen_random_uuid(),
  token text not null references shared_restaurant_links(token) on delete cascade,
  event_name text not null check (
    event_name in (
      'share_opened',
      'share_signup_clicked',
      'share_login_clicked',
      'share_to_do_saved',
      'share_to_do_converted'
    )
  ),
  sharer_user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  to_eat_item_id uuid references to_eat_items(id) on delete set null,
  visit_id uuid references visits(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists to_eat_items_source_share_token_idx
  on to_eat_items (source_share_token)
  where source_share_token is not null;

create index if not exists share_events_token_created_idx
  on share_events (token, created_at desc);

create index if not exists share_events_sharer_created_idx
  on share_events (sharer_user_id, created_at desc);

create index if not exists share_events_event_created_idx
  on share_events (event_name, created_at desc);

create index if not exists share_events_visitor_idx
  on share_events (visitor_id)
  where visitor_id is not null;

alter table share_events enable row level security;

grant select on share_events to authenticated;

drop policy if exists "Sharers can view own share events" on share_events;
create policy "Sharers can view own share events"
on share_events for select
to authenticated
using ((select auth.uid()) = sharer_user_id);
