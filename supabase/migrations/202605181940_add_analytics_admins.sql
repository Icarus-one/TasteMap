create table if not exists analytics_admins (
  email text primary key,
  created_at timestamptz default now()
);

alter table analytics_admins enable row level security;
