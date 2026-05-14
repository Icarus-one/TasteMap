alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table restaurant_aliases enable row level security;
alter table visits enable row level security;
alter table dishes enable row level security;
alter table photos enable row level security;
alter table place_candidates enable row level security;
alter table to_eat_items enable row level security;
alter table shared_restaurant_links enable row level security;

drop policy if exists "Users can manage own profile" on profiles;
create policy "Users can manage own profile"
on profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can manage own restaurants" on restaurants;
create policy "Users can manage own restaurants"
on restaurants for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own restaurant aliases" on restaurant_aliases;
create policy "Users can manage own restaurant aliases"
on restaurant_aliases for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own visits" on visits;
create policy "Users can manage own visits"
on visits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own dishes" on dishes;
create policy "Users can manage own dishes"
on dishes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own photos" on photos;
create policy "Users can manage own photos"
on photos for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own place candidates" on place_candidates;
create policy "Users can manage own place candidates"
on place_candidates for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own to-eat items" on to_eat_items;
create policy "Users can manage own to-eat items"
on to_eat_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own shared restaurant links" on shared_restaurant_links;
create policy "Users can manage own shared restaurant links"
on shared_restaurant_links for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
