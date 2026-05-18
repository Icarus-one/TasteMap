create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'page_view',
      'profile_saved',
      'photo_analyzed',
      'to_eat_link_analyzed',
      'nearby_restaurants_searched',
      'restaurant_match_searched',
      'visit_created',
      'visit_opened',
      'restaurant_opened',
      'to_eat_item_opened',
      'to_eat_item_created',
      'to_eat_item_updated',
      'to_eat_item_converted',
      'to_eat_item_deleted',
      'restaurant_updated',
      'restaurant_deleted',
      'share_clicked',
      'share_link_created',
      'export_created',
      'friend_request_sent',
      'friend_request_accepted',
      'friend_connection_removed',
      'taste_list_created',
      'taste_list_item_added',
      'friend_card_sent',
      'all_data_deleted'
    )
  ),
  path text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists analytics_events_user_created_idx
  on analytics_events (user_id, created_at desc);

create index if not exists analytics_events_event_created_idx
  on analytics_events (event_name, created_at desc);

alter table analytics_events enable row level security;

grant select, insert, delete on analytics_events to authenticated;

drop policy if exists "Users can insert own analytics events" on analytics_events;
create policy "Users can insert own analytics events"
on analytics_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own analytics events" on analytics_events;
create policy "Users can view own analytics events"
on analytics_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own analytics events" on analytics_events;
create policy "Users can delete own analytics events"
on analytics_events for delete
to authenticated
using ((select auth.uid()) = user_id);
