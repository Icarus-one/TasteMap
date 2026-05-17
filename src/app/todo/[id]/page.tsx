/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  MapPin,
  Share2,
  Tags,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { UserText } from "@/components/i18n/UserText";
import { ShareActionButton } from "@/components/share/ShareActionButton";
import { compactAddress, formatDate } from "@/lib/format";
import { getToEatItemById } from "@/lib/data";
import { buildToDoShareText } from "@/lib/share";
import type { ToEatItem } from "@/lib/types";

type TodoItemPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function TodoItemPage({ params }: TodoItemPageProps) {
  const { id } = await params;
  const item = await getToEatItemById(id);

  if (!item) notFound();

  const location =
    item.city || item.address
      ? compactAddress(item.city, item.address)
      : null;
  const hasMeta =
    Boolean(item.restaurant_name) ||
    Boolean(item.city) ||
    Boolean(item.address) ||
    Boolean(item.cuisine_type);
  const shareText = buildToDoShareText(item);

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8">
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          {item.source_image_url ? (
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <img
                src={item.source_image_url}
                alt={item.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-900">
                  {platformLabel(item.source_platform)}
                </span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${statusTone(
                    item.status,
                  )}`}
                >
                  {statusLabel(item.status)}
                </span>
                {item.shareable ? (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                    Shareable
                  </span>
                ) : null}
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                  To-do item
                </p>
                <UserText
                  as="h1"
                  text={item.title}
                  className="text-2xl font-bold text-stone-950 sm:text-4xl"
                  translationClassName="text-sm leading-6 text-stone-500"
                />
                {hasMeta ? (
                  <p className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                    <MapPin aria-hidden="true" className="size-4" />
                    <span>
                      {[item.restaurant_name, location, item.cuisine_type]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </p>
                ) : null}
              </div>

              {item.note ? (
                <UserText
                  as="p"
                  text={item.note}
                  className="max-w-3xl whitespace-pre-wrap text-base leading-7 text-stone-700"
                  translationClassName="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-stone-500"
                />
              ) : (
                <p className="text-sm leading-6 text-stone-500">
                  No note yet. This item is saved as a lightweight food lead.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
              <ShareActionButton
                title={item.title}
                text={shareText}
                urlPath={`/todo/${item.id}`}
                label="Share"
              />
              {item.linked_visit_id ? (
                <Link
                  href={`/visits/${item.linked_visit_id}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300"
                >
                  Open log
                </Link>
              ) : null}
              <Link
                href={`/add?from_todo=${item.id}`}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Turn into log
              </Link>
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Open source
                </a>
              ) : null}
              <Link
                href="/todo"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
              >
                Back to queue
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-stone-950">
              <ClipboardList aria-hidden="true" className="size-5" />
              Saved lead
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact
                icon={<CalendarDays aria-hidden="true" className="size-4" />}
                label="Saved"
                value={formatDate(item.created_at)}
              />
              <Fact
                icon={<CalendarDays aria-hidden="true" className="size-4" />}
                label="Updated"
                value={formatDate(item.updated_at)}
              />
              <Fact
                icon={<MapPin aria-hidden="true" className="size-4" />}
                label="Restaurant"
                value={item.restaurant_name ?? "Not set"}
              />
              <Fact
                icon={<MapPin aria-hidden="true" className="size-4" />}
                label="Area"
                value={location ?? "Not set"}
              />
              <Fact
                icon={<ClipboardList aria-hidden="true" className="size-4" />}
                label="Cuisine"
                value={item.cuisine_type ?? "Not set"}
              />
              <Fact
                icon={<Share2 aria-hidden="true" className="size-4" />}
                label="Sharing"
                value={item.shareable ? "Can be shared" : "Private only"}
              />
            </div>
          </div>

          <aside className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-stone-950">
              <Tags aria-hidden="true" className="size-5" />
              Quick context
            </h2>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm font-medium text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-stone-500">
                No tags yet. This can still stay as a clean, low-friction save.
              </p>
            )}
            <p className="text-sm leading-6 text-stone-500">
              This page is the full detail view for one saved to-do item from your
              queue. When you are ready, you can turn it into a full restaurant log.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 rounded-lg bg-stone-50 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function platformLabel(platform: ToEatItem["source_platform"]) {
  if (platform === "xiaohongshu") return "小红书";
  if (platform === "douyin") return "抖音";
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "web") return "Web";
  return "Manual";
}

function statusLabel(status: ToEatItem["status"]) {
  if (status === "booked") return "Booked";
  if (status === "visited") return "Visited";
  if (status === "archived") return "Archived";
  return "To do";
}

function statusTone(status: ToEatItem["status"]) {
  if (status === "booked") return "bg-sky-50 text-sky-800";
  if (status === "visited") return "bg-emerald-50 text-emerald-800";
  if (status === "archived") return "bg-stone-100 text-stone-700";
  return "bg-amber-50 text-amber-900";
}
