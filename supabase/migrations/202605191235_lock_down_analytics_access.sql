revoke all on analytics_events from anon, authenticated;
revoke all on share_events from anon, authenticated;
revoke all on analytics_admins from anon, authenticated;
revoke all on analytics_daily_snapshots from anon, authenticated;

grant select, insert, delete on analytics_events to authenticated;
grant select on share_events to authenticated;
