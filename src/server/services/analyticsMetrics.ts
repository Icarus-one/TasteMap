import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { coreAnalyticsEvents } from "@/server/services/analytics";
import type { AnalyticsEventName, ShareEventName } from "@/lib/types";

type AnalyticsEventRow = {
  user_id: string;
  event_name: AnalyticsEventName;
  path: string | null;
  session_id: string | null;
  created_at: string;
};

type ShareEventRow = {
  token: string;
  event_name: ShareEventName;
  sharer_user_id: string;
  restaurant_id: string;
  user_id: string | null;
  visitor_id: string | null;
  created_at: string;
};

type AuthUserMetricRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  created_at: string;
};

type RestaurantRow = {
  id: string;
  name: string;
};

export type DailyGrowthMetric = {
  date: string;
  totalRegisteredUsers: number;
  newUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  shareBehaviorCount: number;
};

export type AnalyticsOverview = {
  scope: "all_users" | "current_user";
  totalUsers: number;
  newUsersToday: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers1d: number;
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
  shareFunnel30d: {
    linksCreated: number;
    opens: number;
    uniqueVisitors: number;
    authClicks: number;
    toDoSaves: number;
    conversions: number;
    pulledUsers: number;
    saveRate: number | null;
    conversionRate: number | null;
    topShares: Array<{
      token: string;
      restaurantName: string;
      opens: number;
      saves: number;
      conversions: number;
      pulledUsers: number;
    }>;
  };
  dailyGrowth30d: DailyGrowthMetric[];
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
  const adminCandidate = createSupabaseAdminClient();
  const admin = await isAnalyticsAdmin(adminCandidate, userEmail)
    ? adminCandidate
    : null;
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
  const shareEventsQuery = client
    .from("share_events")
    .select(
      "token, event_name, sharer_user_id, restaurant_id, user_id, visitor_id, created_at",
    )
    .gte("created_at", since90)
    .order("created_at", { ascending: true })
    .limit(50000);
  const restaurantQuery = client
    .from("restaurants")
    .select("id, name")
    .limit(20000);

  if (!admin) {
    profileQuery.eq("id", userId);
    eventQuery.eq("user_id", userId);
    latestQuery.eq("user_id", userId);
    shareEventsQuery.eq("sharer_user_id", userId);
    restaurantQuery.eq("user_id", userId);
  }

  const [
    { data: profiles },
    { data: events },
    { data: latestEvents },
    { data: shareEvents },
    { data: restaurants },
  ] = await Promise.all([
    profileQuery,
    eventQuery,
    latestQuery,
    shareEventsQuery,
    restaurantQuery,
  ]);

  const profileRows = (profiles as ProfileRow[] | null) ?? [];
  const eventRows = (events as AnalyticsEventRow[] | null) ?? [];
  const recentRows = (latestEvents as AnalyticsEventRow[] | null) ?? [];
  const shareEventRows = (shareEvents as ShareEventRow[] | null) ?? [];
  const restaurantRows = (restaurants as RestaurantRow[] | null) ?? [];
  const authUsers = admin ? await listAllAuthUsers(admin) : null;
  const registeredUsers = getRegisteredUsers({
    authUsers,
    profileRows,
    currentUserId: userId,
    scope,
  });
  const events30 = eventRows.filter((event) => isOnOrAfter(event.created_at, since30));
  const events7 = eventRows.filter((event) => isOnOrAfter(event.created_at, since7));
  const events1 = eventRows.filter((event) =>
    isOnOrAfter(event.created_at, startOfDay(now)),
  );
  const shareEvents30 = shareEventRows.filter((event) =>
    isOnOrAfter(event.created_at, since30),
  );
  const shareEvents7 = shareEventRows.filter((event) =>
    isOnOrAfter(event.created_at, since7),
  );
  const shareEvents1 = shareEventRows.filter((event) =>
    isOnOrAfter(event.created_at, startOfDay(now)),
  );
  const coreEvents30 = events30.filter((event) =>
    coreAnalyticsEvents.includes(event.event_name),
  );
  const activeUsers30d = countActiveUsers(events30, shareEvents30, registeredUsers, since30);
  const activeUsers7d = countActiveUsers(events7, shareEvents7, registeredUsers, since7);
  const activeUsers1d = countActiveUsers(
    events1,
    shareEvents1,
    registeredUsers,
    startOfDay(now),
  );
  const coreUsers30d = countDistinctUsers(coreEvents30);
  const dailyGrowth30d = countDailyGrowthMetrics({
    registeredUsers,
    analyticsEvents: eventRows,
    shareEvents: shareEventRows,
    now,
    days: 30,
  });

  const overview: AnalyticsOverview = {
    scope,
    totalUsers: registeredUsers.length,
    newUsersToday: registeredUsers.filter((user) =>
      isOnOrAfter(user.created_at, startOfDay(now)),
    ).length,
    newUsers7d: registeredUsers.filter((user) => isOnOrAfter(user.created_at, since7))
      .length,
    newUsers30d: registeredUsers.filter((user) =>
      isOnOrAfter(user.created_at, since30),
    ).length,
    activeUsers1d,
    activeUsers7d,
    activeUsers30d,
    wauMauRatio: ratioOrNull(activeUsers7d, activeUsers30d),
    coreActions30d: coreEvents30.length,
    totalEvents30d: events30.length,
    sessions30d: countDistinctSessions(events30),
    coreUsers30d,
    activationRate30d: ratioOrNull(coreUsers30d, registeredUsers.length),
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
    shareFunnel30d: summarizeShareFunnel(
      shareEvents30,
      events30,
      restaurantRows,
    ),
    dailyGrowth30d,
    latestEvents: recentRows,
  };

  if (admin && scope === "all_users") {
    await persistDailyMetricSnapshots(admin, dailyGrowth30d);
  }

  return overview;
}

async function isAnalyticsAdmin(
  admin: SupabaseClient | null,
  email: string | null,
) {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase();
  const allowed = (process.env.ANALYTICS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.includes(normalizedEmail)) return true;
  if (!admin) return false;

  const { data, error } = await admin
    .from("analytics_admins")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

function countDistinctUsers(events: AnalyticsEventRow[]) {
  return new Set(events.map((event) => event.user_id)).size;
}

function countActiveUsers(
  analyticsEvents: AnalyticsEventRow[],
  shareEvents: ShareEventRow[],
  registeredUsers: AuthUserMetricRow[],
  since: Date,
) {
  const activeUserIds = new Set<string>();

  analyticsEvents.forEach((event) => activeUserIds.add(event.user_id));
  shareEvents.forEach((event) => {
    if (event.user_id) activeUserIds.add(event.user_id);
  });
  registeredUsers.forEach((user) => {
    if (user.last_sign_in_at && isOnOrAfter(user.last_sign_in_at, since)) {
      activeUserIds.add(user.id);
    }
  });

  return activeUserIds.size;
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

function summarizeShareFunnel(
  shareEvents30: ShareEventRow[],
  analyticsEvents30: AnalyticsEventRow[],
  restaurants: RestaurantRow[],
) {
  const linksCreated = analyticsEvents30.filter(
    (event) => event.event_name === "share_link_created",
  ).length;
  const opens = shareEvents30.filter(
    (event) => event.event_name === "share_opened",
  ).length;
  const authClicks = shareEvents30.filter(
    (event) =>
      event.event_name === "share_signup_clicked" ||
      event.event_name === "share_login_clicked",
  ).length;
  const toDoSaves = shareEvents30.filter(
    (event) => event.event_name === "share_to_do_saved",
  ).length;
  const conversions = shareEvents30.filter(
    (event) => event.event_name === "share_to_do_converted",
  ).length;
  const pulledUsers = countPulledUsers(shareEvents30);
  const restaurantNames = new Map(
    restaurants.map((restaurant) => [restaurant.id, restaurant.name]),
  );

  return {
    linksCreated,
    opens,
    uniqueVisitors: countDistinctShareVisitors(shareEvents30),
    authClicks,
    toDoSaves,
    conversions,
    pulledUsers,
    saveRate: ratioOrNull(toDoSaves, opens),
    conversionRate: ratioOrNull(conversions, toDoSaves),
    topShares: summarizeTopShares(shareEvents30, restaurantNames),
  };
}

async function listAllAuthUsers(client: SupabaseClient) {
  const users: AuthUserMetricRow[] = [];
  const perPage = 1000;
  let page = 1;

  while (page <= 50) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) return null;

    const pageUsers = data.users ?? [];
    users.push(...pageUsers.map(toAuthUserMetricRow));

    if (pageUsers.length < perPage || users.length >= (data.total ?? 0)) break;
    page += 1;
  }

  return users;
}

function toAuthUserMetricRow(user: User): AuthUserMetricRow {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

function getRegisteredUsers({
  authUsers,
  profileRows,
  currentUserId,
  scope,
}: {
  authUsers: AuthUserMetricRow[] | null;
  profileRows: ProfileRow[];
  currentUserId: string;
  scope: AnalyticsOverview["scope"];
}) {
  if (authUsers && scope === "all_users") return authUsers;

  return profileRows.map((profile) => ({
    id: profile.id,
    email: null,
    created_at: profile.created_at,
    last_sign_in_at: profile.id === currentUserId ? new Date().toISOString() : null,
  }));
}

function countDailyGrowthMetrics({
  registeredUsers,
  analyticsEvents,
  shareEvents,
  now,
  days,
}: {
  registeredUsers: AuthUserMetricRow[];
  analyticsEvents: AnalyticsEventRow[];
  shareEvents: ShareEventRow[];
  now: Date;
  days: number;
}): DailyGrowthMetric[] {
  const dayStarts = Array.from({ length: days }, (_, index) =>
    startOfDay(shiftDays(now, -1 * (days - 1 - index))),
  );

  return dayStarts.map((dayStart) => {
    const dayEnd = endOfDay(dayStart);
    const weekStart = startOfDay(shiftDays(dayStart, -6));
    const monthStart = startOfDay(shiftDays(dayStart, -29));

    return {
      date: formatDate(dayStart),
      totalRegisteredUsers: registeredUsers.filter(
        (user) => new Date(user.created_at) <= dayEnd,
      ).length,
      newUsers: registeredUsers.filter((user) =>
        isBetween(user.created_at, dayStart, dayEnd),
      ).length,
      dailyActiveUsers: countActiveUsersInRange(
        analyticsEvents,
        shareEvents,
        registeredUsers,
        dayStart,
        dayEnd,
      ),
      weeklyActiveUsers: countActiveUsersInRange(
        analyticsEvents,
        shareEvents,
        registeredUsers,
        weekStart,
        dayEnd,
      ),
      monthlyActiveUsers: countActiveUsersInRange(
        analyticsEvents,
        shareEvents,
        registeredUsers,
        monthStart,
        dayEnd,
      ),
      shareBehaviorCount: countShareBehaviorInRange(
        analyticsEvents,
        shareEvents,
        dayStart,
        dayEnd,
      ),
    };
  });
}

function countActiveUsersInRange(
  analyticsEvents: AnalyticsEventRow[],
  shareEvents: ShareEventRow[],
  registeredUsers: AuthUserMetricRow[],
  start: Date,
  end: Date,
) {
  const activeUserIds = new Set<string>();

  analyticsEvents.forEach((event) => {
    if (isBetween(event.created_at, start, end)) activeUserIds.add(event.user_id);
  });
  shareEvents.forEach((event) => {
    if (event.user_id && isBetween(event.created_at, start, end)) {
      activeUserIds.add(event.user_id);
    }
  });
  registeredUsers.forEach((user) => {
    if (user.last_sign_in_at && isBetween(user.last_sign_in_at, start, end)) {
      activeUserIds.add(user.id);
    }
  });

  return activeUserIds.size;
}

function countShareBehaviorInRange(
  analyticsEvents: AnalyticsEventRow[],
  shareEvents: ShareEventRow[],
  start: Date,
  end: Date,
) {
  return (
    analyticsEvents.filter(
      (event) =>
        (event.event_name === "share_clicked" ||
          event.event_name === "share_link_created") &&
        isBetween(event.created_at, start, end),
    ).length +
    shareEvents.filter((event) => isBetween(event.created_at, start, end)).length
  );
}

async function persistDailyMetricSnapshots(
  client: SupabaseClient,
  metrics: DailyGrowthMetric[],
) {
  if (metrics.length === 0) return;

  await client.from("analytics_daily_snapshots").upsert(
    metrics.map((metric) => ({
      snapshot_date: metric.date,
      total_registered_users: metric.totalRegisteredUsers,
      new_users: metric.newUsers,
      daily_active_users: metric.dailyActiveUsers,
      weekly_active_users: metric.weeklyActiveUsers,
      monthly_active_users: metric.monthlyActiveUsers,
      share_behavior_count: metric.shareBehaviorCount,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "snapshot_date" },
  );
}

function countDistinctShareVisitors(events: ShareEventRow[]) {
  return new Set(
    events.map((event) => event.user_id ?? event.visitor_id ?? `${event.token}:${event.created_at}`),
  ).size;
}

function countPulledUsers(events: ShareEventRow[]) {
  return new Set(
    events
      .filter(
        (event) =>
          (event.event_name === "share_to_do_saved" ||
            event.event_name === "share_to_do_converted") &&
          event.user_id &&
          event.user_id !== event.sharer_user_id,
      )
      .map((event) => event.user_id as string),
  ).size;
}

function summarizeTopShares(
  events: ShareEventRow[],
  restaurantNames: Map<string, string>,
) {
  const byToken = new Map<
    string,
    {
      restaurantId: string;
      opens: number;
      saves: number;
      conversions: number;
      users: Set<string>;
    }
  >();

  events.forEach((event) => {
    const current =
      byToken.get(event.token) ??
      {
        restaurantId: event.restaurant_id,
        opens: 0,
        saves: 0,
        conversions: 0,
        users: new Set<string>(),
      };

    if (event.event_name === "share_opened") current.opens += 1;
    if (event.event_name === "share_to_do_saved") current.saves += 1;
    if (event.event_name === "share_to_do_converted") current.conversions += 1;
    if (
      event.user_id &&
      event.user_id !== event.sharer_user_id &&
      (event.event_name === "share_to_do_saved" ||
        event.event_name === "share_to_do_converted")
    ) {
      current.users.add(event.user_id);
    }

    byToken.set(event.token, current);
  });

  return Array.from(byToken.entries())
    .map(([token, summary]) => ({
      token,
      restaurantName:
        restaurantNames.get(summary.restaurantId) ?? token.slice(0, 8),
      opens: summary.opens,
      saves: summary.saves,
      conversions: summary.conversions,
      pulledUsers: summary.users.size,
    }))
    .sort((left, right) => {
      const leftScore = left.saves * 3 + left.conversions * 5 + left.opens;
      const rightScore = right.saves * 3 + right.conversions * 5 + right.opens;
      return rightScore - leftScore;
    })
    .slice(0, 6);
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

function isBetween(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = startOfDay(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
