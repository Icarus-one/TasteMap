import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { coreAnalyticsEvents } from "@/server/services/analytics";
import type { AnalyticsEventName } from "@/lib/types";

type AnalyticsEventRow = {
  user_id: string;
  event_name: AnalyticsEventName;
  path: string | null;
  session_id: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  created_at: string;
};

export type AnalyticsOverview = {
  scope: "all_users" | "current_user";
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers7d: number;
  activeUsers30d: number;
  wauMauRatio: number | null;
  coreActions30d: number;
  totalEvents30d: number;
  sessions30d: number;
  coreUsers30d: number;
  activationRate30d: number | null;
  eventsPerActiveUser30d: number | null;
  coreActionsPerActiveUser30d: number | null;
  latestActiveAt: string | null;
  d7Retention: number | null;
  d30Retention: number | null;
  eventCounts30d: Array<{ eventName: AnalyticsEventName; count: number }>;
  weeklyCoreActions: Array<{ weekStart: string; count: number }>;
  dailyActiveUsers14d: Array<{ date: string; count: number }>;
  topPages30d: Array<{ path: string; count: number }>;
  userActivity30d: Array<{
    userId: string;
    label: string;
    handle: string | null;
    eventCount: number;
    coreActionCount: number;
    lastSeenAt: string;
  }>;
  latestEvents: AnalyticsEventRow[];
};

export async function getAnalyticsOverview({
  supabase,
  userId,
  userEmail,
}: {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string | null;
}): Promise<AnalyticsOverview> {
  const admin = isAnalyticsAdmin(userEmail) ? createSupabaseAdminClient() : null;
  const client = admin ?? supabase;
  const scope = admin ? "all_users" : "current_user";
  const now = new Date();
  const since90 = shiftDays(now, -90).toISOString();
  const since30 = shiftDays(now, -30);
  const since7 = shiftDays(now, -7);

  const profileQuery = client
    .from("profiles")
    .select("id, display_name, handle, created_at")
    .order("created_at", { ascending: true })
    .limit(20000);
  const eventQuery = client
    .from("analytics_events")
    .select("user_id, event_name, path, session_id, created_at")
    .gte("created_at", since90)
    .order("created_at", { ascending: true })
    .limit(50000);
  const latestQuery = client
    .from("analytics_events")
    .select("user_id, event_name, path, session_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!admin) {
    profileQuery.eq("id", userId);
    eventQuery.eq("user_id", userId);
    latestQuery.eq("user_id", userId);
  }

  const [{ data: profiles }, { data: events }, { data: latestEvents }] =
    await Promise.all([profileQuery, eventQuery, latestQuery]);

  const profileRows = (profiles as ProfileRow[] | null) ?? [];
  const eventRows = (events as AnalyticsEventRow[] | null) ?? [];
  const recentRows = (latestEvents as AnalyticsEventRow[] | null) ?? [];
  const events30 = eventRows.filter((event) => isOnOrAfter(event.created_at, since30));
  const events7 = eventRows.filter((event) => isOnOrAfter(event.created_at, since7));
  const coreEvents30 = events30.filter((event) =>
    coreAnalyticsEvents.includes(event.event_name),
  );
  const activeUsers30d = countDistinctUsers(events30);
  const activeUsers7d = countDistinctUsers(events7);
  const coreUsers30d = countDistinctUsers(coreEvents30);

  return {
    scope,
    totalUsers: profileRows.length,
    newUsers7d: profileRows.filter((profile) => isOnOrAfter(profile.created_at, since7))
      .length,
    newUsers30d: profileRows.filter((profile) =>
      isOnOrAfter(profile.created_at, since30),
    ).length,
    activeUsers7d,
    activeUsers30d,
    wauMauRatio: ratioOrNull(activeUsers7d, activeUsers30d),
    coreActions30d: coreEvents30.length,
    totalEvents30d: events30.length,
    sessions30d: countDistinctSessions(events30),
    coreUsers30d,
    activationRate30d: ratioOrNull(coreUsers30d, profileRows.length),
    eventsPerActiveUser30d: ratioOrNull(events30.length, activeUsers30d),
    coreActionsPerActiveUser30d: ratioOrNull(coreEvents30.length, activeUsers30d),
    latestActiveAt: recentRows[0]?.created_at ?? null,
    d7Retention: retentionRate(eventRows, 7),
    d30Retention: retentionRate(eventRows, 30),
    eventCounts30d: countByEvent(events30),
    weeklyCoreActions: countWeeklyCoreActions(coreEvents30, now),
    dailyActiveUsers14d: countDailyActiveUsers(events30, now),
    topPages30d: countTopPages(events30),
    userActivity30d: summarizeUserActivity(events30, coreEvents30, profileRows),
    latestEvents: recentRows,
  };
}

function isAnalyticsAdmin(email: string | null) {
  if (!email) return false;
  const allowed = (process.env.ANALYTICS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

function countDistinctUsers(events: AnalyticsEventRow[]) {
  return new Set(events.map((event) => event.user_id)).size;
}

function countDistinctSessions(events: AnalyticsEventRow[]) {
  return new Set(
    events.map((event) => event.session_id ?? `${event.user_id}:${event.created_at.slice(0, 10)}`),
  ).size;
}

function ratioOrNull(numerator: number, denominator: number) {
  if (denominator === 0) return null;
  return numerator / denominator;
}

function countByEvent(events: AnalyticsEventRow[]) {
  const counts = new Map<AnalyticsEventName, number>();
  events.forEach((event) => {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((left, right) => right.count - left.count);
}

function countTopPages(events: AnalyticsEventRow[]) {
  const counts = new Map<string, number>();
  events
    .filter((event) => event.event_name === "page_view" && event.path)
    .forEach((event) => {
      const path = event.path ?? "/";
      counts.set(path, (counts.get(path) ?? 0) + 1);
    });

  return Array.from(counts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

function countWeeklyCoreActions(events: AnalyticsEventRow[], now: Date) {
  const weekStarts = Array.from({ length: 8 }, (_, index) =>
    startOfWeek(shiftDays(now, -7 * (7 - index))),
  );
  const counts = new Map(weekStarts.map((date) => [formatDate(date), 0]));

  events.forEach((event) => {
    const key = formatDate(startOfWeek(new Date(event.created_at)));
    if (!counts.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([weekStart, count]) => ({
    weekStart,
    count,
  }));
}

function countDailyActiveUsers(events: AnalyticsEventRow[], now: Date) {
  const days = Array.from({ length: 14 }, (_, index) =>
    formatDate(shiftDays(now, -1 * (13 - index))),
  );
  const usersByDay = new Map(days.map((day) => [day, new Set<string>()]));

  events.forEach((event) => {
    const key = event.created_at.slice(0, 10);
    usersByDay.get(key)?.add(event.user_id);
  });

  return days.map((date) => ({
    date,
    count: usersByDay.get(date)?.size ?? 0,
  }));
}

function summarizeUserActivity(
  events30: AnalyticsEventRow[],
  coreEvents30: AnalyticsEventRow[],
  profiles: ProfileRow[],
) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const coreCounts = new Map<string, number>();
  coreEvents30.forEach((event) => {
    coreCounts.set(event.user_id, (coreCounts.get(event.user_id) ?? 0) + 1);
  });

  const activity = new Map<
    string,
    { eventCount: number; lastSeenAt: string }
  >();
  events30.forEach((event) => {
    const current = activity.get(event.user_id);
    activity.set(event.user_id, {
      eventCount: (current?.eventCount ?? 0) + 1,
      lastSeenAt:
        !current || new Date(event.created_at) > new Date(current.lastSeenAt)
          ? event.created_at
          : current.lastSeenAt,
    });
  });

  return Array.from(activity.entries())
    .map(([userId, summary]) => {
      const profile = profilesById.get(userId);
      return {
        userId,
        label: profile?.display_name || profile?.handle || userId.slice(0, 8),
        handle: profile?.handle ?? null,
        eventCount: summary.eventCount,
        coreActionCount: coreCounts.get(userId) ?? 0,
        lastSeenAt: summary.lastSeenAt,
      };
    })
    .sort((left, right) => right.eventCount - left.eventCount)
    .slice(0, 10);
}

function retentionRate(events: AnalyticsEventRow[], days: number) {
  const byUser = new Map<string, Date[]>();
  events.forEach((event) => {
    const dates = byUser.get(event.user_id) ?? [];
    dates.push(new Date(event.created_at));
    byUser.set(event.user_id, dates);
  });

  let eligible = 0;
  let retained = 0;
  const now = new Date();
  byUser.forEach((dates) => {
    const sorted = dates.sort((left, right) => left.getTime() - right.getTime());
    const first = sorted[0];
    if (!first || shiftDays(first, days) > now) return;
    eligible += 1;
    if (sorted.some((date) => date >= shiftDays(first, days))) {
      retained += 1;
    }
  });

  return eligible > 0 ? retained / eligible : null;
}

function isOnOrAfter(value: string, date: Date) {
  return new Date(value) >= date;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
