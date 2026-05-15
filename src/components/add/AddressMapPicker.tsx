"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import {
  loadGoogleMaps,
  type GoogleAddressComponent,
  type GoogleGeocoderResult,
  type GoogleLatLngLiteral,
  type GoogleMap,
  type GoogleMarker,
} from "@/lib/googleMaps";
import { useI18n } from "@/lib/i18n";
import type { RestaurantDraft } from "./NearbyRestaurantPicker";

type AddressMapPickerProps = {
  apiKey: string | null;
  selected: RestaurantDraft;
  onChange: (restaurant: RestaurantDraft) => void;
};

type DraftLocation = {
  point: GoogleLatLngLiteral;
  address: string;
  city: string;
  country: string;
};

type SelectPointOptions = {
  geocoderResult?: GoogleGeocoderResult;
  reverseGeocode: boolean;
};

const fallbackCenter = { lat: 51.5072, lng: -0.1276 };

export function AddressMapPicker({
  apiKey,
  selected,
  onChange,
}: AddressMapPickerProps) {
  const { t } = useI18n();
  const locationClickHint = t("restaurant.location.clickHint");
  const locationLoading = t("restaurant.location.loading");
  const locationSearchFailed = t("restaurant.location.searchFailed");
  const mapLoadError = t("map.loadError");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const selectPointRef = useRef<
    ((point: GoogleLatLngLiteral, options: SelectPointOptions) => Promise<void>) | null
  >(null);
  const initialQuery = [
    selected.address,
    selected.city,
    selected.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [draft, setDraft] = useState<DraftLocation | null>(() =>
    locationFromRestaurant(selected),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const selectPoint = useCallback(
    async (point: GoogleLatLngLiteral, options: SelectPointOptions) => {
      if (!apiKey) return;

      try {
        const google = await loadGoogleMaps(apiKey);
        await google.maps.importLibrary?.("geocoding");

        let result = options.geocoderResult;
        if (!result && options.reverseGeocode) {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: point });
          result = response.results[0];
        }

        const nextDraft = {
          point,
          address: result?.formatted_address ?? selected.address ?? "",
          city: cityFromComponents(result?.address_components) ?? selected.city ?? "",
          country:
            countryFromComponents(result?.address_components) ??
            selected.country ??
            "",
        };

        setDraft(nextDraft);
        setQuery(nextDraft.address);
        setStatus("ready");
        setMessage(locationClickHint);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(point);
          mapInstanceRef.current.setZoom(17);
          placeMarker(
            google,
            mapInstanceRef.current,
            markerRef,
            point,
            selected.name,
            (nextPoint) => {
              void selectPointRef.current?.(nextPoint, { reverseGeocode: true });
            },
          );
        }
      } catch (caught) {
        setStatus("error");
        setMessage(errorMessage(caught, locationSearchFailed));
      }
    },
    [
      apiKey,
      locationClickHint,
      locationSearchFailed,
      selected.address,
      selected.city,
      selected.country,
      selected.name,
    ],
  );
  useEffect(() => {
    selectPointRef.current = selectPoint;
  }, [selectPoint]);

  useEffect(() => {
    if (!isOpen || !apiKey || !mapRef.current) return;

    let cancelled = false;
    setStatus("loading");
    setMessage(locationLoading);

    loadGoogleMaps(apiKey)
      .then(async (google) => {
        await google.maps.importLibrary?.("maps");
        await google.maps.importLibrary?.("geocoding");

        if (cancelled || !mapRef.current) return;

        const startingPoint = draft?.point ?? locationFromRestaurant(selected)?.point;
        const map =
          mapInstanceRef.current ??
          new google.maps.Map(mapRef.current, {
            center: startingPoint ?? fallbackCenter,
            zoom: startingPoint ? 16 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            draggableCursor: "crosshair",
          });

        mapInstanceRef.current = map;

        if (startingPoint) {
          placeMarker(google, map, markerRef, startingPoint, selected.name, (point) => {
            void selectPoint(point, { reverseGeocode: true });
          });
        }

        map.addListener("click", (event) => {
          const latLng = event.latLng;
          if (!latLng) return;
          void selectPoint(
            { lat: latLng.lat(), lng: latLng.lng() },
            { reverseGeocode: true },
          );
        });

        setStatus("ready");
        setMessage(locationClickHint);
      })
      .catch((caught) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(errorMessage(caught, mapLoadError));
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiKey,
    draft?.point,
    isOpen,
    locationClickHint,
    locationLoading,
    mapLoadError,
    selected,
    selectPoint,
  ]);

  async function searchAddress() {
    const trimmed = query.trim();
    if (!trimmed || !apiKey) return;

    setStatus("loading");
    setMessage(locationLoading);

    try {
      const google = await loadGoogleMaps(apiKey);
      await google.maps.importLibrary?.("geocoding");
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: trimmed });
      const result = response.results[0];
      const location = result?.geometry?.location;

      if (!location) {
        setStatus("ready");
        setMessage(locationSearchFailed);
        return;
      }

      await selectPoint(
        { lat: location.lat(), lng: location.lng() },
        { geocoderResult: result, reverseGeocode: false },
      );
    } catch (caught) {
      setStatus("error");
      setMessage(errorMessage(caught, locationSearchFailed));
    }
  }

  function applyDraft() {
    if (!draft) return;

    onChange({
      ...selected,
      mode: "manual",
      input_name:
        selected.mode === "manual"
          ? selected.input_name ?? selected.name
          : selected.name,
      address: draft.address,
      city: draft.city,
      country: draft.country,
      latitude: draft.point.lat,
      longitude: draft.point.lng,
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-stone-900">
            <LocateFixed aria-hidden="true" className="size-4" />
            {t("restaurant.location.title")}
          </span>
          <span className="text-xs leading-5 text-stone-500">
            {t("restaurant.location.subtitle")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-800 shadow-sm transition hover:border-stone-400"
        >
          {t("restaurant.location.reselect")}
        </button>
      </div>

      {draft ? (
        <p className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
          <MapPin aria-hidden="true" className="size-4" />
          <span>{t("restaurant.location.selected")}</span>
          <span className="font-mono">
            {draft.point.lat.toFixed(5)}, {draft.point.lng.toFixed(5)}
          </span>
        </p>
      ) : null}

      {isOpen ? (
        apiKey ? (
          <div className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchAddress();
                  }
                }}
                className="h-11 min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                placeholder={t("restaurant.location.searchPlaceholder")}
              />
              <button
                type="button"
                onClick={() => void searchAddress()}
                disabled={!query.trim() || status === "loading"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search aria-hidden="true" className="size-4" />
                {t("restaurant.location.search")}
              </button>
            </div>

            <div className="relative min-h-[18rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <div ref={mapRef} className="absolute inset-0" />
              {status === "loading" ? (
                <div className="absolute inset-0 grid place-items-center bg-stone-50/80 p-4 text-center text-sm font-semibold text-stone-700">
                  {t("restaurant.location.loading")}
                </div>
              ) : null}
            </div>

            {message ? (
              <p className="text-xs leading-5 text-stone-500">{message}</p>
            ) : null}

            <button
              type="button"
              onClick={applyDraft}
              disabled={!draft}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("restaurant.location.usePoint")}
            </button>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            {t("restaurant.location.missingKey")}
          </p>
        )
      ) : null}
    </div>
  );
}

function locationFromRestaurant(restaurant: RestaurantDraft): DraftLocation | null {
  if (!isNumber(restaurant.latitude) || !isNumber(restaurant.longitude)) {
    return null;
  }

  return {
    point: { lat: restaurant.latitude, lng: restaurant.longitude },
    address: restaurant.address ?? "",
    city: restaurant.city ?? "",
    country: restaurant.country ?? "",
  };
}

function placeMarker(
  google: Awaited<ReturnType<typeof loadGoogleMaps>>,
  map: GoogleMap,
  markerRef: MutableRefObject<GoogleMarker | null>,
  point: GoogleLatLngLiteral,
  title: string,
  onDragEnd: (point: GoogleLatLngLiteral) => void,
) {
  if (markerRef.current) {
    markerRef.current.setPosition(point);
    return;
  }

  const marker = new google.maps.Marker({
    position: point,
    map,
    title: title || "Selected location",
    draggable: true,
  });

  marker.addListener("dragend", (event) => {
    const latLng = event?.latLng;
    if (!latLng) return;
    onDragEnd({ lat: latLng.lat(), lng: latLng.lng() });
  });

  markerRef.current = marker;
}

function cityFromComponents(components?: GoogleAddressComponent[]) {
  return componentName(components, [
    "postal_town",
    "locality",
    "sublocality",
    "administrative_area_level_2",
    "administrative_area_level_1",
  ]);
}

function countryFromComponents(components?: GoogleAddressComponent[]) {
  return componentName(components, ["country"]);
}

function componentName(components: GoogleAddressComponent[] | undefined, types: string[]) {
  return components?.find((component) =>
    types.some((type) => component.types.includes(type)),
  )?.long_name;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}
