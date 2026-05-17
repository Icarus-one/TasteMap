"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { DishRecognitionReview, type EditableDish } from "@/components/add/DishRecognitionReview";
import {
  NearbyRestaurantPicker,
  emptyManualRestaurant,
  type RestaurantDraft,
} from "@/components/add/NearbyRestaurantPicker";
import { PhotoPreviewGrid } from "@/components/add/PhotoPreviewGrid";
import { PhotoUploadDropzone } from "@/components/add/PhotoUploadDropzone";
import { QuickRatingForm } from "@/components/add/QuickRatingForm";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import { fileToDataUrl, safeFileName } from "@/lib/file";
import { readPhotoMetadata } from "@/lib/exif";
import { requestDeviceLocation } from "@/lib/location";
import { useI18n, type I18nKey } from "@/lib/i18n";
import type {
  AddRecordState,
  Confidence,
  LocationSource,
  PhotoAIAnalysis,
  PhotoType,
  RestaurantCandidate,
  RestaurantMatchCandidate,
  UploadedPhoto,
} from "@/lib/types";

type AddRecordClientProps = {
  configured: boolean;
  mapsApiKey: string | null;
  availableTags: string[];
  prefillToDoItem?: {
    id: string;
    title: string;
    restaurant_name: string | null;
    city: string | null;
    address: string | null;
    cuisine_type: string | null;
    note: string | null;
    tags: string[] | null;
  } | null;
};

type AnalyzePhotoResponse = {
  photo_type?: PhotoType;
  detected_dishes?: {
    name_guess?: string;
    cuisine_guess?: string | null;
    category?: string | null;
    visible_ingredients?: string[];
    confidence?: Confidence;
  }[];
  suggested_tags?: string[];
  summary_guess?: string | null;
  confidence?: Confidence;
  error?: string;
};

const stateLabelKeys: Record<AddRecordState, I18nKey> = {
  idle: "add.state.idle",
  reading_metadata: "add.state.reading_metadata",
  uploading_photo: "add.state.uploading_photo",
  analyzing_photo: "add.state.analyzing_photo",
  finding_restaurants: "add.state.finding_restaurants",
  confirming_restaurant: "add.state.confirming_restaurant",
  confirming_dishes: "add.state.confirming_dishes",
  quick_review: "add.state.quick_review",
  saving: "add.state.saving",
  success: "add.state.success",
  error: "add.state.error",
};

export function AddRecordClient({
  configured,
  mapsApiKey,
  availableTags,
  prefillToDoItem = null,
}: AddRecordClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [state, setState] = useState<AddRecordState>("idle");
  const [statusText, setStatusText] = useState(
    t("add.status.initial"),
  );
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [candidates, setCandidates] = useState<RestaurantCandidate[]>([]);
  const [archiveMatches, setArchiveMatches] = useState<RestaurantMatchCandidate[]>([]);
  const [restaurant, setRestaurant] =
    useState<RestaurantDraft>(() => getPrefilledRestaurant(prefillToDoItem));
  const [dishes, setDishes] = useState<EditableDish[]>([]);
  const [stars, setStars] = useState(4.0);
  const [companions, setCompanions] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [summary, setSummary] = useState(() => prefillToDoItem?.note ?? "");
  const [tags, setTags] = useState<string[]>(() => prefillToDoItem?.tags ?? []);
  const previewUrlsRef = useRef(new Set<string>());
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!prefillToDoItem || prefillAppliedRef.current) return;

    setRestaurant(getPrefilledRestaurant(prefillToDoItem));
    setSummary(prefillToDoItem.note ?? "");
    setTags(prefillToDoItem.tags ?? []);
    setStatusText(
      "Starting from a saved to-do item. Add photos if you have them, then turn it into a full restaurant log.",
    );
    prefillAppliedRef.current = true;
  }, [prefillToDoItem]);

  const isWorking = [
    "reading_metadata",
    "uploading_photo",
    "analyzing_photo",
    "finding_restaurants",
    "saving",
  ].includes(state);
  const isSaving = state === "saving";
  const canUploadToSupabase = configured && canUseSupabaseInBrowser();

  const canConfirmRestaurant = restaurant.name.trim().length > 0;
  const canSave =
    canConfirmRestaurant &&
    !isSaving &&
    stars >= 0 &&
    stars <= 5;

  const primaryLocation = useMemo(() => getPrimaryLocation(photos), [photos]);
  const firstTakenAt = photos.find((photo) => photo.takenAt)?.takenAt ?? null;

  useEffect(() => {
    const queryName = restaurant.input_name?.trim() || restaurant.name.trim();
    if (queryName.length < 2) {
      const timeout = window.setTimeout(() => setArchiveMatches([]), 0);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/restaurant-match-candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: queryName,
            city: emptyToNull(restaurant.city),
            address: emptyToNull(restaurant.address),
            latitude: restaurant.latitude ?? primaryLocation?.latitude ?? null,
            longitude: restaurant.longitude ?? primaryLocation?.longitude ?? null,
            provider_place_id: restaurant.provider_place_id ?? null,
          }),
        });

        if (!response.ok) {
          setArchiveMatches([]);
          return;
        }

        const payload = (await response.json()) as {
          candidates?: RestaurantMatchCandidate[];
        };
        setArchiveMatches(payload.candidates ?? []);
      } catch {
        setArchiveMatches([]);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    primaryLocation?.latitude,
    primaryLocation?.longitude,
    restaurant.address,
    restaurant.city,
    restaurant.input_name,
    restaurant.latitude,
    restaurant.longitude,
    restaurant.name,
    restaurant.provider_place_id,
  ]);

  async function handleFilesSelected(files: File[]) {
    const existingPhotos = photos;
    const isFirstBatch = existingPhotos.length === 0;

    setError(null);
    if (isFirstBatch) {
      setCandidates([]);
      setArchiveMatches([]);
      setRestaurant(getPrefilledRestaurant(prefillToDoItem));
      setDishes([]);
      setCompanions("");
      setAveragePrice("");
      setSummary(prefillToDoItem?.note ?? "");
      setTags(prefillToDoItem?.tags ?? []);
      setPhotos([]);
    }

    setState("reading_metadata");
    setStatusText("Reading EXIF time and GPS from the photo.");

    try {
      const prepared: UploadedPhoto[] = await Promise.all(
        files.map(async (file) => {
          const metadata = await readPhotoMetadata(file);
          const previewUrl = URL.createObjectURL(file);
          previewUrlsRef.current.add(previewUrl);

          return {
            id: createId(),
            file,
            previewUrl,
            takenAt: metadata.takenAt,
            exifLatitude: metadata.latitude,
            exifLongitude: metadata.longitude,
            exifExists: metadata.exifExists,
            locationSource: metadata.locationSource,
          } satisfies UploadedPhoto;
        }),
      );

      const hasExifLocation = prepared.some(
        (photo) => photo.exifLatitude !== null && photo.exifLongitude !== null,
      );
      let deviceLocation: { latitude: number; longitude: number } | null = null;

      if (!hasExifLocation) {
        setStatusText("No GPS found in the photo, asking for device location.");
        deviceLocation = await requestDeviceLocation();
      }

      const locatedPhotos: UploadedPhoto[] = prepared.map((photo) => {
        if (photo.locationSource === "exif") return photo;
        if (deviceLocation) {
          return {
            ...photo,
            deviceLatitude: deviceLocation.latitude,
            deviceLongitude: deviceLocation.longitude,
            locationSource: "device" as LocationSource,
          };
        }
        return photo;
      });

      const locatedCombinedPhotos = applyPhotoRoles([
        ...existingPhotos,
        ...locatedPhotos,
      ]);
      setPhotos(locatedCombinedPhotos);

      let newPhotosForAnalysis = locatedPhotos;
      let preparedForAnalysis = locatedCombinedPhotos;

      if (canUploadToSupabase) {
        setState("uploading_photo");
        setStatusText("Uploading photos to your private food-photos bucket.");
        newPhotosForAnalysis = await uploadPhotos(locatedPhotos);
        preparedForAnalysis = applyPhotoRoles([
          ...existingPhotos,
          ...newPhotosForAnalysis,
        ]);
        setPhotos(preparedForAnalysis);
      } else {
        setStatusText(
          "Preview mode: photos stay local in the browser until Supabase is configured.",
        );
      }

      setState("analyzing_photo");
      setStatusText(
        preparedForAnalysis.length > 1
          ? "Treating the first photo as the restaurant shot and using the rest for dish guesses."
          : "Asking AI for editable dish guesses.",
      );
      const analyzedNewPhotos = await analyzePhotos(
        newPhotosForAnalysis,
        existingPhotos.length,
        preparedForAnalysis.length,
      );
      const analyzedPhotos = applyPhotoRoles([
        ...existingPhotos,
        ...analyzedNewPhotos,
      ]);
      setPhotos(analyzedPhotos);
      setDishes((current) => mergeDetectedDishes(analyzedPhotos, current));

      const location = getPrimaryLocation(analyzedPhotos);
      if (location) {
        setState("finding_restaurants");
        setStatusText("Looking for nearby restaurants.");
        const nearby = await findNearbyRestaurants(location);
        setCandidates(nearby);
        if (nearby[0] && !restaurant.name.trim()) {
          setRestaurant({
            mode: "provider",
            provider_place_id: nearby[0].providerPlaceId,
            provider_name: nearby[0].provider,
            input_name: nearby[0].name,
            name: nearby[0].name,
            address: nearby[0].address ?? null,
            city: null,
            country: null,
            latitude: nearby[0].latitude ?? null,
            longitude: nearby[0].longitude ?? null,
            cuisine_type: nearby[0].cuisineOrCategory ?? null,
          });
        }
      } else {
        setStatusText("No location available, so restaurant confirmation is manual.");
      }

      setStatusText(
        "Review the restaurant, dishes, and notes together in one editor.",
      );
      setState("quick_review");
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Photo processing failed.");
    }
  }

  async function uploadPhotos(items: UploadedPhoto[]) {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Please sign in before uploading photos.");
    }

    return Promise.all(
      items.map(async (photo) => {
        if (!photo.file) return photo;

        const filename = safeFileName(photo.file.name) || "food-photo.jpg";
        const dateFolder = new Date().toISOString().slice(0, 10);
        const storagePath = `${user.id}/${dateFolder}/${photo.id}-${filename}`;
        const { error: uploadError } = await supabase.storage
          .from("food-photos")
          .upload(storagePath, photo.file, {
            contentType: photo.file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = await supabase.storage
          .from("food-photos")
          .createSignedUrl(storagePath, 60 * 60);

        return {
          ...photo,
          storagePath,
          publicUrl: data?.signedUrl ?? null,
        };
      }),
    );
  }

  async function analyzePhotos(
    items: UploadedPhoto[],
    startIndex = 0,
    total = items.length,
  ) {
    return Promise.all(
      items.map(async (photo, index) => {
        if (!photo.file) return photo;
        const dataUrl = await fileToDataUrl(photo.file);
        const response = await fetch("/api/analyze-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photo_base64: dataUrl,
            photo_storage_path: photo.storagePath,
            exif: {
              taken_at: photo.takenAt ?? null,
              latitude: photo.exifLatitude ?? null,
              longitude: photo.exifLongitude ?? null,
            },
          }),
        });
        const payload = (await response.json()) as AnalyzePhotoResponse;
        const photoIndex = startIndex + index;
        const normalized = normalizeAnalysis(payload, photo, photoIndex);
        return {
          ...photo,
          aiAnalysis: applyPhotoRole(normalized, photoIndex, total),
        };
      }),
    );
  }

  async function findNearbyRestaurants(location: {
    latitude: number;
    longitude: number;
  }) {
    const response = await fetch("/api/nearby-restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: 600,
      }),
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as {
      candidates?: {
        provider?: string;
        provider_place_id?: string;
        name?: string;
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        distance_meters?: number | null;
        provider_rating?: number | null;
        cuisine_or_category?: string | null;
        raw?: unknown;
      }[];
    };

    return (payload.candidates ?? [])
      .filter((candidate) => candidate.name)
      .map((candidate) => ({
        provider: candidate.provider ?? "places_api",
        providerPlaceId: candidate.provider_place_id ?? createId(),
        name: candidate.name ?? "Unknown restaurant",
        address: candidate.address ?? null,
        latitude: candidate.latitude ?? null,
        longitude: candidate.longitude ?? null,
        distanceMeters: candidate.distance_meters ?? null,
        providerRating: candidate.provider_rating ?? null,
        cuisineOrCategory: candidate.cuisine_or_category ?? null,
        raw: candidate.raw,
      }));
  }

  async function saveVisit() {
    if (!canSave) return;
    setState("saving");
    setError(null);
    setStatusText(t("add.status.saving"));

    try {
      const photoPayload = (
        await Promise.all(
          photos.map(async (photo) => {
            if (canUploadToSupabase && !photo.storagePath) {
              return null;
            }

            if (!canUploadToSupabase && !photo.file) {
              return null;
            }

            const localPublicUrl =
              !canUploadToSupabase && photo.file
                ? await fileToDataUrl(photo.file)
                : null;

            return {
              storage_path: photo.storagePath ?? `local/${photo.id}`,
              public_url: photo.publicUrl ?? localPublicUrl,
              photo_type: photo.aiAnalysis?.photoType ?? "unknown",
              ai_analysis_json: photo.aiAnalysis ?? null,
              taken_at: photo.takenAt ?? null,
              exif_exists: photo.exifExists,
              exif_latitude: photo.exifLatitude ?? null,
              exif_longitude: photo.exifLongitude ?? null,
              location_source: photo.locationSource,
              ai_confidence: photo.aiAnalysis?.confidence ?? "unknown",
            };
          }),
        )
      ).filter((photo) => photo !== null);

      const response = await fetch("/api/create-visit-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant: {
            mode: restaurant.mode,
            restaurant_id: restaurant.restaurant_id ?? null,
            provider_place_id: restaurant.provider_place_id ?? null,
            provider_name: restaurant.provider_name ?? null,
            input_name: emptyToNull(restaurant.input_name) ?? restaurant.name.trim(),
            name: restaurant.name.trim(),
            address: emptyToNull(restaurant.address),
            city: emptyToNull(restaurant.city),
            country: emptyToNull(restaurant.country),
            latitude: restaurant.latitude ?? primaryLocation?.latitude ?? null,
            longitude: restaurant.longitude ?? primaryLocation?.longitude ?? null,
            cuisine_type: emptyToNull(restaurant.cuisine_type),
          },
          visit: {
            visit_date: toDateOnly(firstTakenAt ?? new Date().toISOString()),
            taken_at: firstTakenAt,
            companions: emptyToNull(companions),
            average_price: parseOptionalNumber(averagePrice),
            total_score: stars,
            will_revisit: revisitFromStars(stars),
            summary: summarizeLog(summary),
            detailed_review: emptyToNull(summary),
            tags,
            location_source:
              primaryLocation?.source ??
              (hasManualRestaurantLocation(restaurant) ? "manual" : "unknown"),
            restaurant_match_source: matchSourceForRestaurant(restaurant.mode),
          },
          dishes: dishes
            .filter((dish) => dish.name.trim())
            .map((dish) => ({
              name: dish.name.trim(),
              name_ai_guess: emptyToNull(dish.nameGuess),
              cuisine_guess: emptyToNull(dish.cuisineGuess),
              category: emptyToNull(dish.category),
              visible_ingredients: dish.visibleIngredients ?? [],
              ai_confidence: dish.confidence,
              user_confirmed: true,
              is_recommended: dish.isRecommended,
              is_bad: dish.isBad,
            })),
          photos: photoPayload,
        }),
      });

      const payload = (await readJsonResponse(response)) as {
        visit_id?: string;
        restaurant_id?: string;
        error?: string;
      };

      if (!response.ok || !payload.visit_id) {
        setState("error");
        setError(payload.error ?? "Could not save this visit.");
        return;
      }

      if (prefillToDoItem) {
        await fetch("/api/to-eat-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: prefillToDoItem.id,
            status: "visited",
            linked_visit_id: payload.visit_id,
            linked_restaurant_id: payload.restaurant_id ?? null,
          }),
        }).catch(() => null);
      }

      setState("success");
      router.push(`/visits/${payload.visit_id}`);
      router.refresh();
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Could not save this visit.");
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return current.filter((photo) => photo.id !== id);
    });
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/10 px-4">
          <div
            role="alert"
            className="pointer-events-auto grid w-full max-w-xl gap-3 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-950 shadow-xl"
          >
            <p className="text-sm font-bold uppercase text-rose-800">
              {t("add.saveFailed")}
            </p>
            <p className="text-sm leading-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="justify-self-end rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-900 transition hover:bg-rose-100"
            >
              {t("add.dismiss")}
            </button>
          </div>
        </div>
      ) : null}
      <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              {t("add.hero.eyebrow")}
            </p>
            <h1 className="text-2xl font-bold text-stone-950 sm:text-3xl">
              {t("add.hero.title")}
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
            {isWorking ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            )}
            {t(stateLabelKeys[state])}
          </span>
        </div>
        <p className="text-sm leading-6 text-stone-600">{statusText}</p>
        {!canUploadToSupabase ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("add.localMode")}
          </p>
        ) : null}
        {prefillToDoItem ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {t("add.prefill")}
          </p>
        ) : null}
      </section>

      <PhotoUploadDropzone disabled={isWorking} onFilesSelected={handleFilesSelected} />
      <PhotoPreviewGrid photos={photos} onRemove={!isWorking ? removePhoto : undefined} />

      <div className="grid gap-6 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              {t("add.editor.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-stone-950">
              {t("add.editor.title")}
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              {t("add.editor.subtitle")}
            </p>
        </div>

        <NearbyRestaurantPicker
          candidates={candidates}
          archiveMatches={archiveMatches}
          mapsApiKey={mapsApiKey}
          selected={restaurant}
          onChange={setRestaurant}
          onSelectArchiveMatch={(candidate) =>
            setRestaurant((current) => ({
              mode: "existing",
              restaurant_id: candidate.id,
              provider_place_id: candidate.provider_place_id,
              provider_name: current.provider_name ?? null,
              input_name: current.input_name ?? current.name,
              name: candidate.name,
              address: candidate.address,
              city: candidate.city,
              country: current.country ?? null,
              latitude: current.latitude ?? primaryLocation?.latitude ?? null,
              longitude: current.longitude ?? primaryLocation?.longitude ?? null,
              cuisine_type: candidate.cuisine_type,
            }))
          }
        />

        <DishRecognitionReview dishes={dishes} onChange={setDishes} />

        <QuickRatingForm
          stars={stars}
          companions={companions}
          averagePrice={averagePrice}
          availableTags={availableTags}
          summary={summary}
          tags={tags}
          onStarsChange={setStars}
          onCompanionsChange={setCompanions}
          onAveragePriceChange={setAveragePrice}
          onSummaryChange={setSummary}
          onTagsChange={setTags}
        />

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={saveVisit}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              canUploadToSupabase
                ? t("add.savePrivate")
                : t("add.saveLocal")
            }
          >
            {isSaving ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {canUploadToSupabase ? t("add.savePrivate") : t("add.saveLocal")}
          </button>
        </div>
      </div>
    </div>
  );
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text.slice(0, 240) || `Request failed with ${response.status}.`,
    };
  }
}

function normalizeAnalysis(
  payload: AnalyzePhotoResponse,
  photo: UploadedPhoto,
  index: number,
): PhotoAIAnalysis {
  return {
    photoType: payload.photo_type ?? "unknown",
    detectedDishes: (payload.detected_dishes ?? []).map((dish) => ({
      id: createId(),
      nameGuess: dish.name_guess ?? "",
      name: dish.name_guess ?? "",
      cuisineGuess: dish.cuisine_guess ?? "",
      category: dish.category ?? "",
      visibleIngredients: dish.visible_ingredients ?? [],
      confidence: dish.confidence ?? "unknown",
      userConfirmed: Boolean(dish.name_guess),
      sourcePhotoId: photo.id,
      sourcePhotoPreviewUrl: photo.previewUrl,
      sourcePhotoLabel: index === 0 ? "Restaurant photo" : `Dish photo ${index}`,
    })),
    suggestedTags: payload.suggested_tags ?? [],
    summaryGuess: payload.summary_guess ?? null,
    confidence: payload.confidence ?? "unknown",
    error: payload.error,
  };
}

function mergeDetectedDishes(
  photos: UploadedPhoto[],
  existingDishes: EditableDish[] = [],
): EditableDish[] {
  const map = new Map<string, EditableDish>();
  const existingByKey = new Map(
    existingDishes
      .map((dish) => [dish.name.trim().toLowerCase(), dish] as const)
      .filter(([key]) => key.length > 0),
  );

  photos.forEach((photo) => {
    if (photo.aiAnalysis?.photoType === "restaurant") return;
    photo.aiAnalysis?.detectedDishes.forEach((dish) => {
      const key = dish.name.trim().toLowerCase();
      if (!key || map.has(key)) return;
      const existing = existingByKey.get(key);
      map.set(key, {
        ...dish,
        name: existing?.name ?? dish.name,
        isRecommended: existing?.isRecommended ?? false,
        isBad: existing?.isBad ?? false,
      });
    });
  });

  return Array.from(map.values());
}

function applyPhotoRoles(photos: UploadedPhoto[]): UploadedPhoto[] {
  return photos.map((photo, index) => {
    if (!photo.aiAnalysis) return photo;
    return {
      ...photo,
      aiAnalysis: applyPhotoRole(photo.aiAnalysis, index, photos.length),
    };
  });
}

function applyPhotoRole(
  analysis: PhotoAIAnalysis,
  index: number,
  total: number,
): PhotoAIAnalysis {
  if (total <= 1) return analysis;

  if (index === 0) {
    return {
      ...analysis,
      photoType: "restaurant",
      detectedDishes: [],
      suggestedTags: Array.from(new Set(["restaurant", ...analysis.suggestedTags])),
    };
  }

  if (analysis.photoType === "unknown") {
    return {
      ...analysis,
      photoType: "dish",
    };
  }

  return analysis;
}

function getPrimaryLocation(photos: UploadedPhoto[]) {
  const exifPhoto = photos.find(
    (photo) => isNumber(photo.exifLatitude) && isNumber(photo.exifLongitude),
  );
  if (exifPhoto && isNumber(exifPhoto.exifLatitude) && isNumber(exifPhoto.exifLongitude)) {
    return {
      latitude: exifPhoto.exifLatitude,
      longitude: exifPhoto.exifLongitude,
      source: "exif" as LocationSource,
    };
  }

  const devicePhoto = photos.find(
    (photo) => isNumber(photo.deviceLatitude) && isNumber(photo.deviceLongitude),
  );
  if (devicePhoto && isNumber(devicePhoto.deviceLatitude) && isNumber(devicePhoto.deviceLongitude)) {
    return {
      latitude: devicePhoto.deviceLatitude,
      longitude: devicePhoto.deviceLongitude,
      source: "device" as LocationSource,
    };
  }

  return null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toDateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function matchSourceForRestaurant(mode: RestaurantDraft["mode"]) {
  if (mode === "provider") return "places_api";
  if (mode === "existing") return "existing_restaurant";
  return "manual";
}

function hasManualRestaurantLocation(restaurant: RestaurantDraft) {
  return isNumber(restaurant.latitude) && isNumber(restaurant.longitude);
}

function revisitFromStars(stars: number) {
  if (stars >= 4) return "Yes" as const;
  if (stars >= 2.5) return "Maybe" as const;
  return "No" as const;
}

function summarizeLog(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getPrefilledRestaurant(
  prefillToDoItem: AddRecordClientProps["prefillToDoItem"],
): RestaurantDraft {
  if (!prefillToDoItem) {
    return emptyManualRestaurant();
  }

  const restaurantName =
    prefillToDoItem.restaurant_name?.trim() || prefillToDoItem.title.trim();

  return {
    ...emptyManualRestaurant(),
    mode: "manual",
    input_name: restaurantName,
    name: restaurantName,
    city: prefillToDoItem.city ?? "",
    address: prefillToDoItem.address ?? "",
    cuisine_type: prefillToDoItem.cuisine_type ?? "",
  };
}
