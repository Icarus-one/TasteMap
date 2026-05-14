create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text,
  country text,
  address text,
  latitude double precision,
  longitude double precision,
  cuisine_type text,
  average_price numeric,
  currency text default 'GBP',
  provider_place_id text,
  provider_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists restaurant_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  alias_name text not null,
  normalized_alias_name text not null,
  source text check (source in ('user_input', 'ai', 'places_api')) default 'user_input',
  created_at timestamptz default now(),
  unique (user_id, restaurant_id, normalized_alias_name)
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  visit_date date,
  companions text,
  average_price numeric,
  total_score numeric check (total_score >= 0 and total_score <= 5),
  taste_score numeric check (taste_score >= 0 and taste_score <= 5),
  environment_score numeric check (environment_score >= 0 and environment_score <= 5),
  service_score numeric check (service_score >= 0 and service_score <= 5),
  value_score numeric check (value_score >= 0 and value_score <= 5),
  will_revisit text check (will_revisit in ('Yes', 'Maybe', 'No')),
  summary text,
  detailed_review text,
  recommended_dishes text,
  bad_dishes text,
  suitable_scenarios text[],
  location_source text check (location_source in ('exif', 'device', 'manual', 'unknown')) default 'unknown',
  location_confidence text check (location_confidence in ('high', 'medium', 'low', 'unknown')) default 'unknown',
  restaurant_match_source text check (restaurant_match_source in ('places_api', 'manual', 'existing_restaurant', 'unknown')) default 'unknown',
  ai_generated boolean default false,
  user_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  taken_at timestamptz
);

create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  visit_id uuid references visits(id) on delete cascade,
  name text not null,
  name_ai_guess text,
  cuisine_guess text,
  category text,
  visible_ingredients text[],
  score numeric check (score >= 0 and score <= 5),
  price numeric,
  currency text default 'GBP',
  is_recommended boolean default false,
  is_bad boolean default false,
  comment text,
  ai_confidence text check (ai_confidence in ('high', 'medium', 'low', 'unknown')) default 'unknown',
  user_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  visit_id uuid references visits(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  storage_path text not null,
  public_url text,
  photo_type text check (photo_type in ('dish', 'menu', 'restaurant', 'receipt', 'unknown')) default 'unknown',
  caption text,
  exif_exists boolean default false,
  exif_latitude double precision,
  exif_longitude double precision,
  location_source text check (location_source in ('exif', 'device', 'manual', 'unknown')) default 'unknown',
  ai_analysis_json jsonb,
  ai_detected_dishes jsonb,
  ai_confidence text check (ai_confidence in ('high', 'medium', 'low', 'unknown')) default 'unknown',
  created_at timestamptz default now(),
  taken_at timestamptz
);

create table if not exists place_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visit_id uuid references visits(id) on delete cascade,
  provider text,
  provider_place_id text,
  name text,
  address text,
  latitude double precision,
  longitude double precision,
  distance_meters numeric,
  provider_rating numeric,
  raw_json jsonb,
  selected boolean default false,
  created_at timestamptz default now()
);

create table if not exists to_eat_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  source_url text,
  source_image_url text,
  source_platform text check (source_platform in ('xiaohongshu', 'douyin', 'instagram', 'tiktok', 'web', 'manual')) default 'manual',
  source_creator text,

  restaurant_name text,
  city text,
  address text,
  cuisine_type text,
  note text,
  tags text[],

  priority integer check (priority >= 1 and priority <= 5) default 3,
  status text check (status in ('to_eat', 'booked', 'visited', 'archived')) default 'to_eat',
  shareable boolean default false,

  linked_restaurant_id uuid references restaurants(id) on delete set null,
  linked_visit_id uuid references visits(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shared_restaurant_links (
  token text primary key default encode(gen_random_bytes(18), 'hex'),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  unique (user_id, restaurant_id)
);

create index if not exists restaurants_user_provider_idx
  on restaurants (user_id, provider_place_id)
  where provider_place_id is not null;
create index if not exists restaurant_aliases_user_restaurant_idx
  on restaurant_aliases (user_id, restaurant_id);
create index if not exists restaurant_aliases_user_normalized_idx
  on restaurant_aliases (user_id, normalized_alias_name);

create index if not exists visits_user_date_idx on visits (user_id, visit_date desc);
create index if not exists dishes_user_visit_idx on dishes (user_id, visit_id);
create index if not exists photos_user_visit_idx on photos (user_id, visit_id);
create index if not exists place_candidates_user_visit_idx on place_candidates (user_id, visit_id);
create index if not exists to_eat_items_user_status_idx on to_eat_items (user_id, status, created_at desc);
create index if not exists shared_restaurant_links_restaurant_idx
  on shared_restaurant_links (restaurant_id);
