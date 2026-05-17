create index if not exists taste_list_items_added_by_idx on taste_list_items (added_by);
create index if not exists taste_list_items_restaurant_idx on taste_list_items (restaurant_id);
create index if not exists taste_list_items_visit_idx on taste_list_items (visit_id);
create index if not exists friend_card_sends_restaurant_idx on friend_card_sends (restaurant_id);
create index if not exists friend_card_sends_visit_idx on friend_card_sends (visit_id);

grant usage on schema public to authenticated;
grant select on profiles to authenticated;
grant select, insert, update, delete on friendships, taste_lists, taste_list_items, friend_card_sends to authenticated;

drop policy if exists "Users can manage own profile" on profiles;
drop policy if exists "Users can create own profile" on profiles;
create policy "Users can create own profile"
on profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on profiles;
create policy "Users can delete own profile"
on profiles for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Authenticated users can read profiles" on profiles;
create policy "Authenticated users can read profiles"
on profiles for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "Users can manage own restaurants" on restaurants;
create policy "Users can manage own restaurants"
on restaurants for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own restaurant aliases" on restaurant_aliases;
create policy "Users can manage own restaurant aliases"
on restaurant_aliases for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own visits" on visits;
create policy "Users can manage own visits"
on visits for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own dishes" on dishes;
create policy "Users can manage own dishes"
on dishes for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own photos" on photos;
create policy "Users can manage own photos"
on photos for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own place candidates" on place_candidates;
create policy "Users can manage own place candidates"
on place_candidates for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own to-eat items" on to_eat_items;
create policy "Users can manage own to-eat items"
on to_eat_items for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own shared restaurant links" on shared_restaurant_links;
create policy "Users can manage own shared restaurant links"
on shared_restaurant_links for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view related friendships" on friendships;
create policy "Users can view related friendships"
on friendships for select
to authenticated
using ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "Users can create friend requests" on friendships;
create policy "Users can create friend requests"
on friendships for insert
to authenticated
with check ((select auth.uid()) = requester_id);

drop policy if exists "Users can update related friendships" on friendships;
create policy "Users can update related friendships"
on friendships for update
to authenticated
using ((select auth.uid()) in (requester_id, addressee_id))
with check ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "Users can delete related friendships" on friendships;
create policy "Users can delete related friendships"
on friendships for delete
to authenticated
using ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "Users can view visible taste lists" on taste_lists;
create policy "Users can view visible taste lists"
on taste_lists for select
to authenticated
using (
  (select auth.uid()) = user_id
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from friendships
      where status = 'accepted'
        and (
          (requester_id = (select auth.uid()) and addressee_id = taste_lists.user_id)
          or (addressee_id = (select auth.uid()) and requester_id = taste_lists.user_id)
        )
    )
  )
);

drop policy if exists "Users can manage own taste lists" on taste_lists;
drop policy if exists "Users can create own taste lists" on taste_lists;
create policy "Users can create own taste lists"
on taste_lists for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own taste lists" on taste_lists;
create policy "Users can update own taste lists"
on taste_lists for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own taste lists" on taste_lists;
create policy "Users can delete own taste lists"
on taste_lists for delete
to authenticated
using ((select auth.uid()) = user_id);

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
drop policy if exists "Users can add items to own taste lists" on taste_list_items;
create policy "Users can add items to own taste lists"
on taste_list_items for insert
to authenticated
with check (
  added_by = (select auth.uid())
  and exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update items in own taste lists" on taste_list_items;
create policy "Users can update items in own taste lists"
on taste_list_items for update
to authenticated
using (
  exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = (select auth.uid())
  )
)
with check (
  added_by = (select auth.uid())
  and exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete items in own taste lists" on taste_list_items;
create policy "Users can delete items in own taste lists"
on taste_list_items for delete
to authenticated
using (
  exists (
    select 1
    from taste_lists
    where taste_lists.id = taste_list_items.list_id
      and taste_lists.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view related friend card sends" on friend_card_sends;
create policy "Users can view related friend card sends"
on friend_card_sends for select
to authenticated
using ((select auth.uid()) in (sender_id, recipient_id));

drop policy if exists "Users can send cards to accepted friends" on friend_card_sends;
create policy "Users can send cards to accepted friends"
on friend_card_sends for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
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
using ((select auth.uid()) = recipient_id)
with check ((select auth.uid()) = recipient_id);
