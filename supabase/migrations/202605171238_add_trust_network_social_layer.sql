create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_unique_idx
  on friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create table if not exists taste_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  visibility text check (visibility in ('private', 'friends', 'public')) default 'friends',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists taste_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references taste_lists(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete set null,
  visit_id uuid references visits(id) on delete set null,
  item_title text not null,
  item_city text,
  item_address text,
  note text,
  created_at timestamptz default now()
);

create table if not exists friend_card_sends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete set null,
  visit_id uuid references visits(id) on delete set null,
  card_title text not null,
  card_subtitle text,
  note text,
  seen_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

create index if not exists friendships_requester_idx on friendships (requester_id, status);
create index if not exists friendships_addressee_idx on friendships (addressee_id, status);
create index if not exists taste_lists_user_visibility_idx on taste_lists (user_id, visibility, updated_at desc);
create index if not exists taste_list_items_list_idx on taste_list_items (list_id, created_at desc);
create index if not exists friend_card_sends_recipient_idx on friend_card_sends (recipient_id, created_at desc);
create index if not exists friend_card_sends_sender_idx on friend_card_sends (sender_id, created_at desc);

alter table friendships enable row level security;
alter table taste_lists enable row level security;
alter table taste_list_items enable row level security;
alter table friend_card_sends enable row level security;

drop policy if exists "Authenticated users can read profiles" on profiles;
create policy "Authenticated users can read profiles"
on profiles for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Users can view related friendships" on friendships;
create policy "Users can view related friendships"
on friendships for select
to authenticated
using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Users can create friend requests" on friendships;
create policy "Users can create friend requests"
on friendships for insert
to authenticated
with check (auth.uid() = requester_id);

drop policy if exists "Users can update related friendships" on friendships;
create policy "Users can update related friendships"
on friendships for update
to authenticated
using (auth.uid() in (requester_id, addressee_id))
with check (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Users can delete related friendships" on friendships;
create policy "Users can delete related friendships"
on friendships for delete
to authenticated
using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Users can view visible taste lists" on taste_lists;
create policy "Users can view visible taste lists"
on taste_lists for select
to authenticated
using (
  auth.uid() = user_id
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from friendships
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and addressee_id = taste_lists.user_id)
          or (addressee_id = auth.uid() and requester_id = taste_lists.user_id)
        )
    )
  )
);

drop policy if exists "Users can manage own taste lists" on taste_lists;
create policy "Users can manage own taste lists"
on taste_lists for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view visible taste list items" on taste_list_items;
create policy "Users can view visible taste list items"
on taste_list_items for select
to authenticated
using (
  exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
  )
);

drop policy if exists "Users can manage items in own taste lists" on taste_list_items;
create policy "Users can manage items in own taste lists"
on taste_list_items for all
to authenticated
using (
  exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = auth.uid()
  )
)
with check (
  added_by = auth.uid()
  and exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = auth.uid()
  )
);

drop policy if exists "Users can view related friend card sends" on friend_card_sends;
create policy "Users can view related friend card sends"
on friend_card_sends for select
to authenticated
using (auth.uid() in (sender_id, recipient_id));

drop policy if exists "Users can send cards to accepted friends" on friend_card_sends;
create policy "Users can send cards to accepted friends"
on friend_card_sends for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from friendships
    where status = 'accepted'
      and (
        (requester_id = sender_id and addressee_id = recipient_id)
        or (requester_id = recipient_id and addressee_id = sender_id)
      )
  )
);

drop policy if exists "Recipients can mark friend cards seen" on friend_card_sends;
create policy "Recipients can mark friend cards seen"
on friend_card_sends for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);
