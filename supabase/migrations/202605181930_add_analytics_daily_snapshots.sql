create table if not exists analytics_daily_snapshots (
  snapshot_date date primary key,
  total_registered_users integer not null default 0,
  new_users integer not null default 0,
  daily_active_users integer not null default 0,
  weekly_active_users integer not null default 0,
  monthly_active_users integer not null default 0,
  share_behavior_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists analytics_daily_snapshots_updated_idx
  on analytics_daily_snapshots (updated_at desc);

alter table analytics_daily_snapshots enable row level security;
