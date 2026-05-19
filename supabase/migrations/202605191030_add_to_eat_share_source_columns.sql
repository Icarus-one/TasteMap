alter table to_eat_items
  add column if not exists source_sharer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists source_restaurant_id uuid references restaurants(id) on delete set null;

create index if not exists to_eat_items_source_sharer_idx
  on to_eat_items (source_sharer_user_id, created_at desc)
  where source_sharer_user_id is not null;

create index if not exists to_eat_items_source_restaurant_idx
  on to_eat_items (source_restaurant_id, created_at desc)
  where source_restaurant_id is not null;
