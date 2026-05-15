"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { UserText } from "@/components/i18n/UserText";
import { compactAddress, formatScore } from "@/lib/format";
import {
  loadGoogleMaps,
  type GoogleInfoWindow,
  type GoogleMap,
  type GoogleMarker,
} from "@/lib/googleMaps";
import { useI18n } from "@/lib/i18n";

type RestaurantMapPoint = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  score: number | null;
  visitCount: number;
  latestSummary: string | null;
};

type RestaurantMapClientProps = {
  apiKey: string | null;
  points: RestaurantMapPoint[];
  missingLocationCount: number;
};

export function RestaurantMapClient({
  apiKey,
  points,
  missingLocationCount,
}: RestaurantMapClientProps) {
  const { t } = useI18n();
  const mapLoadError = t("map.loadError");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const [selectedId, setSelectedId] = useState(points[0]?.id ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey ? "idle" : "error",
  );
  const [message, setMessage] = useState<string | null>(
    apiKey ? null : t("map.missingKey"),
  );

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedId) ?? points[0] ?? null,
    [points, selectedId],
  );

  useEffect(() => {
    if (!apiKey || points.length === 0 || !mapRef.current) return;

    let cancelled = false;
    setStatus("loading");
    setMessage(null);

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const first = points[0];
        const map =
          mapInstanceRef.current ??
          new google.maps.Map(mapRef.current, {
            center: { lat: first.latitude, lng: first.longitude },
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

        mapInstanceRef.current = map;
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        infoWindowRef.current = infoWindowRef.current ?? new google.maps.InfoWindow();

        const bounds = new google.maps.LatLngBounds();

        points.forEach((point) => {
          const position = { lat: point.latitude, lng: point.longitude };
          bounds.extend(position);
          const marker = new google.maps.Marker({
            position,
            map,
            title: point.name,
            label:
              point.score !== null
                ? {
                    text: formatScore(point.score),
                    color: "#ffffff",
                    fontWeight: "700",
                  }
                : undefined,
          });

          marker.addListener("click", () => {
            setSelectedId(point.id);
            infoWindowRef.current?.setContent(infoWindowContent(point));
            infoWindowRef.current?.open({ anchor: marker, map });
          });

          markersRef.current.push(marker);
        });

        map.fitBounds(bounds, 56);
        setStatus("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(errorMessage(caught, mapLoadError));
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, mapLoadError, points]);

  function focusPoint(point: RestaurantMapPoint) {
    setSelectedId(point.id);
    mapInstanceRef.current?.panTo({ lat: point.latitude, lng: point.longitude });
    mapInstanceRef.current?.setZoom(15);
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm leading-6 text-stone-500">
        {t("map.empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-stone-950">
              {points.length} {t("map.plotted")}
            </p>
            {missingLocationCount > 0 ? (
              <p className="text-xs leading-5 text-stone-500">
                {missingLocationCount} {t("map.missingLocations")}
              </p>
            ) : null}
          </div>
          <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
            Google Maps
          </span>
        </div>
        <div className="relative min-h-[28rem]">
          <div ref={mapRef} className="absolute inset-0" />
          {status !== "ready" ? (
            <div className="absolute inset-0 grid place-items-center bg-stone-50/90 p-6 text-center">
              <div className="grid max-w-sm gap-2">
                <p className="text-sm font-bold text-stone-950">
                  {status === "loading" ? t("map.loading") : t("map.unavailable")}
                </p>
                {message ? (
                  <p className="text-sm leading-6 text-stone-500">{message}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="grid content-start gap-3">
        {selectedPoint ? <SelectedRestaurantCard point={selectedPoint} /> : null}
        <div className="grid max-h-[32rem] gap-2 overflow-auto pr-1">
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              onClick={() => focusPoint(point)}
              className={`grid gap-1 rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-stone-300 ${
                point.id === selectedId
                  ? "border-stone-950"
                  : "border-stone-200"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <UserText
                  as="span"
                  text={point.name}
                  className="line-clamp-1 text-sm font-bold text-stone-950"
                  translationAs="span"
                  translationClassName="block text-xs leading-5 text-stone-500"
                />
                {point.score !== null ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-stone-700">
                    {formatScore(point.score)}
                    <Star aria-hidden="true" className="size-3 fill-current" />
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">
                  {compactAddress(point.city, point.address)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function SelectedRestaurantCard({ point }: { point: RestaurantMapPoint }) {
  const { t } = useI18n();

  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-1">
        <UserText
          as="h2"
          text={point.name}
          className="text-xl font-bold text-stone-950"
          translationClassName="text-sm leading-6 text-stone-500"
        />
        <p className="flex items-center gap-1 text-sm text-stone-500">
          <MapPin aria-hidden="true" className="size-4" />
          {compactAddress(point.city, point.address)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {point.score !== null ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm font-semibold text-stone-800">
            {formatScore(point.score)}
            <Star aria-hidden="true" className="size-4 fill-current" />
          </span>
        ) : null}
        <span className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-sm font-semibold text-stone-700">
          {point.visitCount} log{point.visitCount === 1 ? "" : "s"}
        </span>
      </div>
      {point.latestSummary ? (
        <UserText
          as="p"
          text={point.latestSummary}
          className="line-clamp-3 text-sm leading-6 text-stone-600"
          translationClassName="line-clamp-3 text-xs leading-5 text-stone-500"
        />
      ) : null}
      <Link
        href={`/restaurants/${point.id}`}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
      >
        {t("common.open")}
      </Link>
    </section>
  );
}

function infoWindowContent(point: RestaurantMapPoint) {
  const score = point.score !== null ? `${formatScore(point.score)} stars` : "Not scored";
  const address = compactAddress(point.city, point.address);

  return `
    <div style="display:grid;gap:4px;max-width:220px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <strong style="font-size:14px;color:#1c1917">${escapeHtml(point.name)}</strong>
      <span style="font-size:12px;color:#78716c">${escapeHtml(address)}</span>
      <span style="font-size:12px;font-weight:700;color:#44403c">${escapeHtml(score)}</span>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type { RestaurantMapPoint };
