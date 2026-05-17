type GoogleMapsTarget = {
  name?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function buildGoogleMapsSearchUrl(target: GoogleMapsTarget) {
  const hasCoordinates =
    typeof target.latitude === "number" &&
    Number.isFinite(target.latitude) &&
    typeof target.longitude === "number" &&
    Number.isFinite(target.longitude);

  const query = hasCoordinates
    ? `${target.latitude},${target.longitude}`
    : [target.name, target.address, target.city]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(", ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
