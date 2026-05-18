"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardPlus,
  Clock3,
  MousePointerClick,
  Repeat2,
  Share2,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useLanguage, type LanguageCode } from "@/lib/i18n";
import type { AnalyticsEventName } from "@/lib/types";
import type {
  AnalyticsOverview,
  DailyGrowthMetric,
} from "@/server/services/analyticsMetrics";

type MetricsDashboardClientProps = {
  overview: AnalyticsOverview;
};

const copy = {
  en: {
    eyebrow: "Traction evidence",
    title: "Growth and retention metrics",
    subtitle:
      "A founder-friendly view of usage, activation, retention, and product pull for beta updates, investor conversations, and admin review.",
    scopeLabel: "Scope",
    allUsers: "all users",
    currentUser: "current user",
    registeredUsers: "Registered users",
    newToday: "New today",
    newIn30d: "new in 30d",
    dau: "DAU",
    wau: "WAU",
    activeToday: "active today",
    mau: "MAU",
    wauDetail: "WAU",
    stickiness: "WAU / MAU",
    weeklyStickiness: "weekly stickiness",
    coreActions: "Core actions",
    totalEvents30d: "total events in 30d",
    activatedUsers: "Activated users",
    activationRate: "activation rate",
    sessions: "Sessions",
    trackedSessions30d: "tracked sessions in 30d",
    eventsPerActiveUser: "Events / active user",
    engagementDepth: "engagement depth",
    coreActionsPerActiveUser: "Core actions / active user",
    utilityDepth: "utility depth",
    latestActivity: "Latest activity",
    retention: "Retention",
    weeklyCoreActions: "Weekly core actions",
    dailyActiveUsers: "Daily active users",
    dailyGrowth: "Daily growth and activity",
    cumulativeUsers: "Cumulative users",
    dailyNewUsers: "New users",
    dailyActive: "Daily active",
    weeklyActive: "Weekly active",
    monthlyActive: "Monthly active",
    shareBehaviorCount: "Share behavior",
    shareBehaviorShort: "Share",
    recentDailyRows: "Latest daily rows",
    investorReadout: "Investor readout",
    investorActive: "Active usage",
    investorActiveText: "people were active in the last 30 days.",
    investorActivation: "Activation",
    investorActivationText: "users performed at least one core product action.",
    investorRetention: "Retention",
    investorRetentionText: "D7/D30 repeat usage signal from tracked events.",
    eventCounts: "Event counts, last 30d",
    topPages: "Top pages, last 30d",
    userActivity: "Most active users, last 30d",
    latestEvents: "Latest events",
    shareFunnel: "Share funnel, last 30d",
    shareLinks: "Share links",
    shareOpens: "Share opens",
    shareVisitors: "Share visitors",
    shareSaves: "Saved to-do",
    shareConversions: "To-do to log",
    sharePulledUsers: "Pulled users",
    shareSaveRate: "save rate",
    shareConversionRate: "conversion rate",
    topSharedCards: "Top shared cards",
    emptyShares: "No share-attributed activity yet.",
    emptyEvents: "No events recorded yet.",
    emptyPageViews: "No page views recorded yet.",
    emptyUsers: "No active users in this window yet.",
    time: "Time",
    event: "Event",
    path: "Path",
    user: "User",
    events: "Events",
    lastSeen: "Last seen",
    core: "Core",
    d7Retention: "D7 retention",
    d30Retention: "D30 retention",
    noValue: "-",
  },
  zh: {
    eyebrow: "增长证据",
    title: "增长与留存统计",
    subtitle:
      "面向创始人、投资人和管理员的使用概览：看活跃、激活、留存和核心行为，快速判断产品牵引力。",
    scopeLabel: "范围",
    allUsers: "全部用户",
    currentUser: "当前用户",
    registeredUsers: "注册用户",
    newToday: "今日新增",
    newIn30d: "近 30 天新增",
    dau: "日活用户",
    wau: "周活用户",
    activeToday: "今日活跃",
    mau: "月活用户",
    wauDetail: "周活用户",
    stickiness: "周活 / 月活",
    weeklyStickiness: "周粘性",
    coreActions: "核心行为",
    totalEvents30d: "近 30 天总事件",
    activatedUsers: "激活用户",
    activationRate: "激活率",
    sessions: "会话",
    trackedSessions30d: "近 30 天追踪会话",
    eventsPerActiveUser: "人均事件",
    engagementDepth: "参与深度",
    coreActionsPerActiveUser: "人均核心行为",
    utilityDepth: "使用深度",
    latestActivity: "最近活跃",
    retention: "留存",
    weeklyCoreActions: "每周核心行为",
    dailyActiveUsers: "每日活跃用户",
    dailyGrowth: "每日增长与活跃",
    cumulativeUsers: "累计注册用户",
    dailyNewUsers: "新增用户",
    dailyActive: "日活用户",
    weeklyActive: "周活用户",
    monthlyActive: "月活用户",
    shareBehaviorCount: "分享行为数",
    shareBehaviorShort: "分享",
    recentDailyRows: "最近每日明细",
    investorReadout: "投资人速览",
    investorActive: "活跃使用",
    investorActiveText: "人在近 30 天内有活跃记录。",
    investorActivation: "用户激活",
    investorActivationText: "位用户完成过至少一次核心产品行为。",
    investorRetention: "留存信号",
    investorRetentionText: "基于事件追踪计算 D7/D30 复访信号。",
    eventCounts: "近 30 天事件分布",
    topPages: "近 30 天热门页面",
    userActivity: "近 30 天最活跃用户",
    latestEvents: "最近事件",
    shareFunnel: "近 30 天分享漏斗",
    shareLinks: "分享链接",
    shareOpens: "分享打开",
    shareVisitors: "分享访客",
    shareSaves: "存入待吃",
    shareConversions: "待吃转记录",
    sharePulledUsers: "拉动用户",
    shareSaveRate: "保存率",
    shareConversionRate: "转记录率",
    topSharedCards: "传播最好的餐厅卡",
    emptyShares: "还没有分享归因行为。",
    emptyEvents: "还没有记录到事件。",
    emptyPageViews: "还没有记录到页面访问。",
    emptyUsers: "这个窗口内还没有活跃用户。",
    time: "时间",
    event: "事件",
    path: "页面",
    user: "用户",
    events: "事件",
    lastSeen: "最近活跃",
    core: "核心",
    d7Retention: "D7 留存",
    d30Retention: "D30 留存",
    noValue: "-",
  },
  fr: {
    eyebrow: "Preuve de traction",
    title: "Indicateurs de croissance et de retention",
    subtitle:
      "Une vue utile pour fondateurs, investisseurs et admins: activation, retention, engagement et signaux d'usage produit.",
    scopeLabel: "Portee",
    allUsers: "tous les utilisateurs",
    currentUser: "utilisateur actuel",
    registeredUsers: "Utilisateurs inscrits",
    newToday: "Nouveaux aujourd'hui",
    newIn30d: "nouveaux en 30 j",
    dau: "DAU",
    wau: "WAU",
    activeToday: "actifs aujourd'hui",
    mau: "MAU",
    wauDetail: "WAU",
    stickiness: "WAU / MAU",
    weeklyStickiness: "stickiness hebdo",
    coreActions: "Actions coeur",
    totalEvents30d: "evenements en 30 j",
    activatedUsers: "Utilisateurs actives",
    activationRate: "taux d'activation",
    sessions: "Sessions",
    trackedSessions30d: "sessions suivies en 30 j",
    eventsPerActiveUser: "Evenements / utilisateur actif",
    engagementDepth: "profondeur d'engagement",
    coreActionsPerActiveUser: "Actions coeur / utilisateur actif",
    utilityDepth: "profondeur d'usage",
    latestActivity: "Derniere activite",
    retention: "Retention",
    weeklyCoreActions: "Actions coeur hebdo",
    dailyActiveUsers: "Utilisateurs actifs quotidiens",
    dailyGrowth: "Croissance et activite quotidiennes",
    cumulativeUsers: "Utilisateurs cumules",
    dailyNewUsers: "Nouveaux utilisateurs",
    dailyActive: "Actifs quotidiens",
    weeklyActive: "Actifs hebdo",
    monthlyActive: "Actifs mensuels",
    shareBehaviorCount: "Actions de partage",
    shareBehaviorShort: "Partage",
    recentDailyRows: "Dernieres lignes quotidiennes",
    investorReadout: "Lecture investisseur",
    investorActive: "Usage actif",
    investorActiveText: "personnes actives sur les 30 derniers jours.",
    investorActivation: "Activation",
    investorActivationText: "utilisateurs ont fait au moins une action coeur.",
    investorRetention: "Signal de retention",
    investorRetentionText: "D7/D30 calcules a partir des evenements suivis.",
    eventCounts: "Evenements, 30 derniers jours",
    topPages: "Pages principales, 30 derniers jours",
    userActivity: "Utilisateurs les plus actifs, 30 derniers jours",
    latestEvents: "Derniers evenements",
    shareFunnel: "Entonnoir de partage, 30 j",
    shareLinks: "Liens partages",
    shareOpens: "Ouvertures",
    shareVisitors: "Visiteurs",
    shareSaves: "Ajouts a essayer",
    shareConversions: "Essai en visite",
    sharePulledUsers: "Utilisateurs tires",
    shareSaveRate: "taux d'ajout",
    shareConversionRate: "taux conversion",
    topSharedCards: "Cartes les plus partagees",
    emptyShares: "Aucune activite attribuee au partage.",
    emptyEvents: "Aucun evenement pour le moment.",
    emptyPageViews: "Aucune vue de page pour le moment.",
    emptyUsers: "Aucun utilisateur actif sur cette periode.",
    time: "Heure",
    event: "Evenement",
    path: "Page",
    user: "Utilisateur",
    events: "Evenements",
    lastSeen: "Derniere activite",
    core: "Coeur",
    d7Retention: "Retention J7",
    d30Retention: "Retention J30",
    noValue: "-",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

const eventLabels: Record<LanguageCode, Record<AnalyticsEventName, string>> = {
  en: {
    page_view: "Page view",
    profile_saved: "Profile saved",
    photo_analyzed: "Photo analyzed",
    to_eat_link_analyzed: "To-do link analyzed",
    nearby_restaurants_searched: "Nearby search",
    restaurant_match_searched: "Restaurant match search",
    visit_created: "Visit created",
    visit_opened: "Visit opened",
    restaurant_opened: "Restaurant opened",
    to_eat_item_opened: "To-do opened",
    to_eat_item_created: "To-do created",
    to_eat_item_updated: "To-do updated",
    to_eat_item_converted: "To-do converted",
    to_eat_item_deleted: "To-do deleted",
    restaurant_updated: "Restaurant updated",
    restaurant_deleted: "Restaurant deleted",
    share_clicked: "Share clicked",
    share_link_created: "Share link created",
    export_created: "Export created",
    friend_request_sent: "Friend request sent",
    friend_request_accepted: "Friend accepted",
    friend_connection_removed: "Friend removed",
    taste_list_created: "Taste list created",
    taste_list_item_added: "Taste list item added",
    friend_card_sent: "Friend card sent",
    all_data_deleted: "All data deleted",
  },
  zh: {
    page_view: "页面访问",
    profile_saved: "保存资料",
    photo_analyzed: "照片分析",
    to_eat_link_analyzed: "待吃链接分析",
    nearby_restaurants_searched: "附近餐厅搜索",
    restaurant_match_searched: "餐厅匹配搜索",
    visit_created: "创建到访记录",
    visit_opened: "打开到访记录",
    restaurant_opened: "打开餐厅",
    to_eat_item_opened: "打开待吃项",
    to_eat_item_created: "创建待吃项",
    to_eat_item_updated: "更新待吃项",
    to_eat_item_converted: "待吃转记录",
    to_eat_item_deleted: "删除待吃项",
    restaurant_updated: "更新餐厅",
    restaurant_deleted: "删除餐厅",
    share_clicked: "点击分享",
    share_link_created: "创建分享链接",
    export_created: "导出数据",
    friend_request_sent: "发送好友请求",
    friend_request_accepted: "接受好友请求",
    friend_connection_removed: "移除好友",
    taste_list_created: "创建美食线索",
    taste_list_item_added: "添加线索项",
    friend_card_sent: "发送好友卡片",
    all_data_deleted: "删除全部数据",
  },
  fr: {
    page_view: "Vue de page",
    profile_saved: "Profil enregistre",
    photo_analyzed: "Photo analysee",
    to_eat_link_analyzed: "Lien a essayer analyse",
    nearby_restaurants_searched: "Recherche a proximite",
    restaurant_match_searched: "Recherche de correspondance",
    visit_created: "Visite creee",
    visit_opened: "Visite ouverte",
    restaurant_opened: "Restaurant ouvert",
    to_eat_item_opened: "Element ouvert",
    to_eat_item_created: "Element cree",
    to_eat_item_updated: "Element mis a jour",
    to_eat_item_converted: "Element converti",
    to_eat_item_deleted: "Element supprime",
    restaurant_updated: "Restaurant mis a jour",
    restaurant_deleted: "Restaurant supprime",
    share_clicked: "Partage clique",
    share_link_created: "Lien de partage cree",
    export_created: "Export cree",
    friend_request_sent: "Demande envoyee",
    friend_request_accepted: "Ami accepte",
    friend_connection_removed: "Ami retire",
    taste_list_created: "Liste creee",
    taste_list_item_added: "Element de liste ajoute",
    friend_card_sent: "Carte envoyee",
    all_data_deleted: "Donnees supprimees",
  },
};

const localeByLanguage: Record<LanguageCode, string> = {
  en: "en-GB",
  zh: "zh-CN",
  fr: "fr-FR",
};

export function MetricsDashboardClient({ overview }: MetricsDashboardClientProps) {
  const language = useLanguage();
  const c = copy[language];
  const eventCopy = eventLabels[language];
  const latestDailyMetric =
    overview.dailyGrowth30d[overview.dailyGrowth30d.length - 1] ?? null;
  const shareBehavior30d = overview.dailyGrowth30d.reduce(
    (sum, day) => sum + day.shareBehaviorCount,
    0,
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
      <section className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              {c.eyebrow}
            </p>
            <h1 className="text-2xl font-bold text-stone-950 sm:text-4xl">
              {c.title}
            </h1>
          </div>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {c.scopeLabel}:{" "}
            {overview.scope === "all_users" ? c.allUsers : c.currentUser}
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          {c.subtitle}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={c.registeredUsers}
          value={formatNumber(overview.totalUsers, language)}
          detail={`+${formatNumber(overview.newUsers30d, language)} ${c.newIn30d}`}
          icon={<Users aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.newToday}
          value={formatNumber(overview.newUsersToday, language)}
          detail={c.dailyNewUsers}
          icon={<TrendingUp aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.dau}
          value={formatNumber(overview.activeUsers1d, language)}
          detail={c.activeToday}
          icon={<CalendarDays aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.wau}
          value={formatNumber(overview.activeUsers7d, language)}
          detail={c.weeklyActive}
          icon={<Repeat2 aria-hidden="true" className="size-5" />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={c.mau}
          value={formatNumber(overview.activeUsers30d, language)}
          detail={c.monthlyActive}
          icon={<Users aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.stickiness}
          value={formatPercent(overview.wauMauRatio, language)}
          detail={c.weeklyStickiness}
          icon={<BarChart3 aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.shareBehaviorCount}
          value={formatNumber(shareBehavior30d, language)}
          detail={c.shareFunnel}
          icon={<Share2 aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.coreActions}
          value={formatNumber(overview.coreActions30d, language)}
          detail={`${formatNumber(overview.totalEvents30d, language)} ${c.totalEvents30d}`}
          icon={<MousePointerClick aria-hidden="true" className="size-5" />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={c.activatedUsers}
          value={formatNumber(overview.coreUsers30d, language)}
          detail={`${formatPercent(overview.activationRate30d, language)} ${c.activationRate}`}
          icon={<UserCheck aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.sessions}
          value={formatNumber(overview.sessions30d, language)}
          detail={c.trackedSessions30d}
          icon={<Activity aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.eventsPerActiveUser}
          value={formatDecimal(overview.eventsPerActiveUser30d, language)}
          detail={c.engagementDepth}
          icon={<Target aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label={c.latestActivity}
          value={overview.latestActiveAt ? formatShortDate(overview.latestActiveAt, language) : c.noValue}
          detail={overview.latestActiveAt ? formatTime(overview.latestActiveAt, language) : c.emptyEvents}
          icon={<Clock3 aria-hidden="true" className="size-5" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Panel title={c.dailyGrowth}>
          <DailyGrowthChart data={overview.dailyGrowth30d} language={language} labels={c} />
        </Panel>

        <Panel title={c.recentDailyRows}>
          <DailyMetricTable
            data={overview.dailyGrowth30d.slice(-7)}
            language={language}
            labels={c}
          />
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={c.shareFunnel}>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label={c.shareLinks}
              value={formatNumber(overview.shareFunnel30d.linksCreated, language)}
              detail={c.shareFunnel}
              icon={<Share2 aria-hidden="true" className="size-5" />}
            />
            <MetricCard
              label={c.shareVisitors}
              value={formatNumber(
                overview.shareFunnel30d.uniqueVisitors,
                language,
              )}
              detail={`${formatNumber(overview.shareFunnel30d.opens, language)} ${c.shareOpens}`}
              icon={<Users aria-hidden="true" className="size-5" />}
            />
            <MetricCard
              label={c.shareSaves}
              value={formatNumber(overview.shareFunnel30d.toDoSaves, language)}
              detail={`${formatPercent(
                overview.shareFunnel30d.saveRate,
                language,
              )} ${c.shareSaveRate}`}
              icon={<ClipboardPlus aria-hidden="true" className="size-5" />}
            />
            <MetricCard
              label={c.sharePulledUsers}
              value={formatNumber(overview.shareFunnel30d.pulledUsers, language)}
              detail={`${formatNumber(
                overview.shareFunnel30d.conversions,
                language,
              )} ${c.shareConversions} / ${formatPercent(
                overview.shareFunnel30d.conversionRate,
                language,
              )} ${c.shareConversionRate}`}
              icon={<UserCheck aria-hidden="true" className="size-5" />}
            />
          </div>
        </Panel>

        <Panel title={c.topSharedCards}>
          <div className="grid gap-3">
            {overview.shareFunnel30d.topShares.length > 0 ? (
              overview.shareFunnel30d.topShares.map((share) => (
                <ShareRow
                  key={share.token}
                  restaurantName={share.restaurantName}
                  opens={share.opens}
                  saves={share.saves}
                  conversions={share.conversions}
                  pulledUsers={share.pulledUsers}
                  language={language}
                />
              ))
            ) : (
              <EmptyState text={c.emptyShares} />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        <Panel title={c.investorReadout}>
          <div className="grid gap-3">
            <ReadoutLine
              label={c.investorActive}
              value={formatNumber(
                latestDailyMetric?.monthlyActiveUsers ?? overview.activeUsers30d,
                language,
              )}
              text={c.investorActiveText}
            />
            <ReadoutLine
              label={c.investorActivation}
              value={formatNumber(overview.coreUsers30d, language)}
              text={c.investorActivationText}
            />
            <ReadoutLine
              label={c.investorRetention}
              value={`${formatPercent(overview.d7Retention, language)} / ${formatPercent(
                overview.d30Retention,
                language,
              )}`}
              text={c.investorRetentionText}
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={c.retention}>
          <div className="grid gap-3 sm:grid-cols-2">
            <RetentionBlock
              label={c.d7Retention}
              value={overview.d7Retention}
              language={language}
            />
            <RetentionBlock
              label={c.d30Retention}
              value={overview.d30Retention}
              language={language}
            />
          </div>
        </Panel>

        <Panel title={c.weeklyCoreActions}>
          <div className="grid gap-2">
            {overview.weeklyCoreActions.map((week) => (
              <BarRow
                key={week.weekStart}
                label={week.weekStart}
                value={week.count}
                max={Math.max(
                  1,
                  ...overview.weeklyCoreActions.map((item) => item.count),
                )}
              />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={c.eventCounts}>
          <div className="grid gap-2">
            {overview.eventCounts30d.length > 0 ? (
              overview.eventCounts30d.map((event) => (
                <BarRow
                  key={event.eventName}
                  label={eventCopy[event.eventName] ?? event.eventName}
                  value={event.count}
                  max={Math.max(
                    1,
                    ...overview.eventCounts30d.map((item) => item.count),
                  )}
                />
              ))
            ) : (
              <EmptyState text={c.emptyEvents} />
            )}
          </div>
        </Panel>

        <Panel title={c.topPages}>
          <div className="grid gap-2">
            {overview.topPages30d.length > 0 ? (
              overview.topPages30d.map((page) => (
                <BarRow
                  key={page.path}
                  label={formatPath(page.path, language)}
                  value={page.count}
                  max={Math.max(
                    1,
                    ...overview.topPages30d.map((item) => item.count),
                  )}
                />
              ))
            ) : (
              <EmptyState text={c.emptyPageViews} />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={c.userActivity}>
          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs font-bold uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">{c.user}</th>
                  <th className="px-3 py-2">{c.events}</th>
                  <th className="px-3 py-2">{c.core}</th>
                  <th className="px-3 py-2">{c.lastSeen}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {overview.userActivity30d.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-3 py-2">
                      <span className="block font-semibold text-stone-900">
                        {user.label}
                      </span>
                      <span className="font-mono text-xs text-stone-500">
                        {user.handle ? `@${user.handle}` : user.userId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-stone-600">
                      {formatNumber(user.eventCount, language)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-stone-600">
                      {formatNumber(user.coreActionCount, language)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-stone-500">
                      {formatShortDate(user.lastSeenAt, language)}
                    </td>
                  </tr>
                ))}
                {overview.userActivity30d.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-stone-500" colSpan={4}>
                      {c.emptyUsers}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={c.latestEvents}>
          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs font-bold uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">{c.time}</th>
                  <th className="px-3 py-2">{c.event}</th>
                  <th className="px-3 py-2">{c.path}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {overview.latestEvents.map((event) => (
                  <tr key={`${event.created_at}-${event.event_name}-${event.path}`}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-stone-500">
                      {formatDateTime(event.created_at, language)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-stone-900">
                      {eventCopy[event.event_name] ?? event.event_name}
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {event.path ? formatPath(event.path, language) : "-"}
                    </td>
                  </tr>
                ))}
                {overview.latestEvents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-stone-500" colSpan={3}>
                      {c.emptyEvents}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-stone-500">
        <p className="text-sm font-semibold">{label}</p>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-stone-950">{value}</p>
        <p className="text-sm text-stone-500">{detail}</p>
      </div>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      {children}
    </section>
  );
}

function ReadoutLine({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm font-semibold text-stone-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">
        <span className="mr-2 text-2xl font-bold text-stone-950">{value}</span>
        {text}
      </p>
    </div>
  );
}

function ShareRow({
  restaurantName,
  opens,
  saves,
  conversions,
  pulledUsers,
  language,
}: {
  restaurantName: string;
  opens: number;
  saves: number;
  conversions: number;
  pulledUsers: number;
  language: LanguageCode;
}) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-bold text-stone-900">
          {restaurantName}
        </p>
        <span className="whitespace-nowrap font-mono text-xs text-stone-500">
          {formatNumber(pulledUsers, language)} users
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-stone-500">
        {formatNumber(opens, language)} opens / {formatNumber(saves, language)} saves /{" "}
        {formatNumber(conversions, language)} logs
      </p>
    </div>
  );
}

function RetentionBlock({
  label,
  value,
  language,
}: {
  label: string;
  value: number | null;
  language: LanguageCode;
}) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm font-semibold text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-stone-950">
        {formatPercent(value, language)}
      </p>
    </div>
  );
}

type DailyMetricKey = Exclude<keyof DailyGrowthMetric, "date">;

const dailyMetricSeries: Array<{
  key: DailyMetricKey;
  labelKey: string;
  color: string;
}> = [
  {
    key: "totalRegisteredUsers",
    labelKey: "cumulativeUsers",
    color: "#047857",
  },
  { key: "newUsers", labelKey: "dailyNewUsers", color: "#0ea5e9" },
  { key: "dailyActiveUsers", labelKey: "dailyActive", color: "#f59e0b" },
  { key: "weeklyActiveUsers", labelKey: "weeklyActive", color: "#7c3aed" },
  { key: "monthlyActiveUsers", labelKey: "monthlyActive", color: "#dc2626" },
  { key: "shareBehaviorCount", labelKey: "shareBehaviorCount", color: "#334155" },
];

function DailyGrowthChart({
  data,
  language,
  labels,
}: {
  data: DailyGrowthMetric[];
  language: LanguageCode;
  labels: Record<string, string>;
}) {
  if (data.length === 0) return <EmptyState text={labels.emptyEvents} />;

  const width = 760;
  const height = 300;
  const margin = { top: 18, right: 18, bottom: 50, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(
    1,
    ...data.flatMap((day) =>
      dailyMetricSeries.map((series) => day[series.key] as number),
    ),
  );
  const ticks = Array.from({ length: 5 }, (_, index) =>
    Math.round((maxValue / 4) * index),
  );
  const xForIndex = (index: number) =>
    margin.left + (plotWidth * index) / Math.max(1, data.length - 1);
  const yForValue = (value: number) =>
    margin.top + plotHeight - (plotHeight * value) / maxValue;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden">
        <svg
          role="img"
          aria-label={labels.dailyGrowth}
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] w-full rounded-lg bg-stone-50"
        >
          {ticks.map((tick) => {
            const y = yForValue(tick);
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-stone-500 text-[11px] font-medium"
                >
                  {formatNumber(tick, language)}
                </text>
              </g>
            );
          })}
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="#a8a29e"
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={height - margin.bottom}
            y2={height - margin.bottom}
            stroke="#a8a29e"
          />
          {dailyMetricSeries.map((series) => {
            const points = data
              .map((day, index) => {
                const x = xForIndex(index);
                const y = yForValue(day[series.key] as number);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <polyline
                key={series.key}
                points={points}
                fill="none"
                stroke={series.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          {data.map((day, index) =>
            index % labelEvery === 0 || index === data.length - 1 ? (
              <text
                key={day.date}
                x={xForIndex(index)}
                y={height - 20}
                textAnchor="middle"
                className="fill-stone-500 text-[11px] font-medium"
              >
                {day.date.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {dailyMetricSeries.map((series) => (
          <span
            key={series.key}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {labels[series.labelKey]}
          </span>
        ))}
      </div>
    </div>
  );
}

function DailyMetricTable({
  data,
  language,
  labels,
}: {
  data: DailyGrowthMetric[];
  language: LanguageCode;
  labels: Record<string, string>;
}) {
  if (data.length === 0) return <EmptyState text={labels.emptyEvents} />;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200">
      <table className="w-full text-left text-xs">
        <thead className="bg-stone-100 font-bold uppercase text-stone-500">
          <tr>
            <th className="px-2 py-2 text-[10px] leading-4">{labels.time}</th>
            <th className="px-2 py-2 text-[10px] leading-4">
              {labels.cumulativeUsers}
            </th>
            <th className="px-2 py-2 text-[10px] leading-4">
              {labels.dailyNewUsers}
            </th>
            <th className="px-2 py-2 text-[10px] leading-4">{labels.dau}</th>
            <th className="px-2 py-2 text-[10px] leading-4">
              {labels.shareBehaviorShort}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white">
          {data.map((day) => (
            <tr key={day.date}>
              <td className="whitespace-nowrap px-2 py-2 font-mono text-stone-500">
                {day.date.slice(5)}
              </td>
              <td className="px-2 py-2 font-mono text-stone-700">
                {formatNumber(day.totalRegisteredUsers, language)}
              </td>
              <td className="px-2 py-2 font-mono text-stone-700">
                {formatNumber(day.newUsers, language)}
              </td>
              <td className="px-2 py-2 font-mono text-stone-700">
                {formatNumber(day.dailyActiveUsers, language)}
              </td>
              <td className="px-2 py-2 font-mono text-stone-700">
                {formatNumber(day.shareBehaviorCount, language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = `${Math.max(4, Math.round((value / max) * 100))}%`;

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-stone-700">{label}</span>
        <span className="font-mono text-xs text-stone-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-500">
      {text}
    </p>
  );
}

function formatNumber(value: number, language: LanguageCode) {
  return new Intl.NumberFormat(localeByLanguage[language]).format(value);
}

function formatDecimal(value: number | null, language: LanguageCode) {
  if (value === null) return copy[language].noValue;
  return new Intl.NumberFormat(localeByLanguage[language], {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number | null, language: LanguageCode) {
  if (value === null) return copy[language].noValue;
  return new Intl.NumberFormat(localeByLanguage[language], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string, language: LanguageCode) {
  return new Intl.DateTimeFormat(localeByLanguage[language], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPath(path: string, language: LanguageCode) {
  const labels: Record<LanguageCode, Record<string, string>> = {
    en: {
      "/": "Dashboard",
      "/add": "Post log",
      "/todo": "To-do",
      "/search": "Archive search",
      "/map": "Map",
      "/friends": "Friends",
      "/settings": "Settings",
      "/metrics": "Metrics",
    },
    zh: {
      "/": "首页",
      "/add": "新增记录",
      "/todo": "待吃清单",
      "/search": "归档搜索",
      "/map": "地图",
      "/friends": "好友",
      "/settings": "设置",
      "/metrics": "统计",
    },
    fr: {
      "/": "Accueil",
      "/add": "Ajouter",
      "/todo": "A essayer",
      "/search": "Recherche",
      "/map": "Carte",
      "/friends": "Amis",
      "/settings": "Reglages",
      "/metrics": "Indicateurs",
    },
  };

  return labels[language][path] ?? path;
}
