"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  loadGoogleMaps,
  type GoogleMap,
  type GoogleMarker,
} from "@/lib/googleMaps";
import { useI18n } from "@/lib/i18n";

type RestaurantLocationMapProps = {
  apiKey: string | null;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export function RestaurantLocationMap({
  apiKey,
  name,
  address,
  latitude,
  longitude,
}: RestaurantLocationMapProps) {
  const { t } = useI18n();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey ? "idle" : "error",
  );
  const [message, setMessage] = useState<string | null>(
    apiKey ? null : t("map.missingKey"),
  );

  useEffect(() => {
    if (!apiKey || typeof latitude !== "number" || typeof longitude !== "number") {
      return;
    }
    if (!mapRef.current) return;

    let cancelled = false;
    const position = { lat: latitude, lng: longitude };
    setStatus("loading");
    setMessage(null);

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const map =
          mapInstanceRef.current ??
          new google.maps.Map(mapRef.current, {
            center: position,
            zoom: 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

        mapInstanceRef.current = map;
        map.setCenter(position);
        map.setZoom(16);

        if (markerRef.current) {
          markerRef.current.setPosition(position);
        } else {
          markerRef.current = new google.maps.Marker({
            position,
            map,
            title: name,
          });
        }

        setStatus("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(errorMessage(caught, t("map.loadError")));
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, latitude, longitude, name, t]);

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return (
      <section className="grid gap-3 rounded-lg border border-dashed border-stone-300 bg-white p-4 text-sm leading-6 text-stone-500">
        <h2 className="flex items-center gap-2 text-xl font-bold text-stone-950">
          <MapPin aria-hidden="true" className="size-5" />
          {t("map.locationTitle")}
        </h2>
        {t("map.noRestaurantLocation")}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div className="grid gap-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-stone-950">
            <MapPin aria-hidden="true" className="size-5" />
            {t("map.locationTitle")}
          </h2>
          <p className="text-sm leading-6 text-stone-500">{address}</p>
        </div>
        <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
          Google Maps
        </span>
      </div>
      <div className="relative min-h-[18rem]">
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
  );
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}
