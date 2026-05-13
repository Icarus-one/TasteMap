import type {
  Restaurant,
  RestaurantAlias,
  RestaurantMatchCandidate,
} from "@/lib/types";

type MatchableRestaurant = Restaurant & {
  aliases?: RestaurantAlias[];
};

type RestaurantMatchQuery = {
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provider_place_id?: string | null;
};

export function buildRestaurantMatchCandidates({
  query,
  restaurants,
}: {
  query: RestaurantMatchQuery;
  restaurants: MatchableRestaurant[];
}): RestaurantMatchCandidate[] {
  const candidates: RestaurantMatchCandidate[] = [];

  restaurants.forEach((restaurant) => {
    const candidate = scoreRestaurantMatch({ query, restaurant });
    if (candidate) {
      candidates.push(candidate);
    }
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function normalizeRestaurantName(value: string | null | undefined) {
  return normalizeFreeText(value)
    .replace(/\b(restaurant|resto|cafe|bar|kitchen|branch)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeFreeText(value: string | null | undefined) {
  return (
    value
      ?.toLowerCase()
      .replace(/[()（）[\]【】,./#!$%^&*;:{}=\-_`~+?"'|\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function scoreRestaurantMatch({
  query,
  restaurant,
}: {
  query: RestaurantMatchQuery;
  restaurant: MatchableRestaurant;
}) {
  const matchedOn: string[] = [];
  let score = 0;

  if (
    query.provider_place_id &&
    restaurant.provider_place_id &&
    query.provider_place_id === restaurant.provider_place_id
  ) {
    matchedOn.push("same place id");
    score += 1;
  }

  const normalizedQueryName = normalizeRestaurantName(query.name);
  const normalizedRestaurantName = normalizeRestaurantName(restaurant.name);

  if (normalizedQueryName && normalizedRestaurantName) {
    if (normalizedQueryName === normalizedRestaurantName) {
      matchedOn.push("same normalized name");
      score += 0.64;
    } else if (
      normalizedQueryName.includes(normalizedRestaurantName) ||
      normalizedRestaurantName.includes(normalizedQueryName)
    ) {
      matchedOn.push("very similar name");
      score += 0.42;
    } else {
      const overlap = tokenOverlap(normalizedQueryName, normalizedRestaurantName);
      if (overlap >= 0.6) {
        matchedOn.push("name tokens overlap");
        score += 0.3;
      } else if (overlap >= 0.35) {
        score += 0.16;
      }
    }
  }

  const aliasHit = (restaurant.aliases ?? []).find((alias) => {
    const normalizedAlias = normalizeRestaurantName(alias.alias_name);
    return (
      normalizedAlias &&
      (normalizedAlias === normalizedQueryName ||
        normalizedAlias.includes(normalizedQueryName) ||
        normalizedQueryName.includes(normalizedAlias))
    );
  });

  if (aliasHit) {
    matchedOn.push(`known alias: ${aliasHit.alias_name}`);
    score += 0.58;
  }

  const normalizedQueryCity = normalizeFreeText(query.city);
  const normalizedRestaurantCity = normalizeFreeText(restaurant.city);
  if (normalizedQueryCity && normalizedRestaurantCity) {
    if (normalizedQueryCity === normalizedRestaurantCity) {
      matchedOn.push("same city");
      score += 0.14;
    } else {
      score -= 0.22;
    }
  }

  const normalizedQueryAddress = normalizeFreeText(query.address);
  const normalizedRestaurantAddress = normalizeFreeText(restaurant.address);
  if (normalizedQueryAddress && normalizedRestaurantAddress) {
    if (
      normalizedRestaurantAddress.includes(normalizedQueryAddress) ||
      normalizedQueryAddress.includes(normalizedRestaurantAddress)
    ) {
      matchedOn.push("same area or address");
      score += 0.18;
    } else {
      const overlap = tokenOverlap(
        normalizedQueryAddress,
        normalizedRestaurantAddress,
      );
      if (overlap >= 0.45) {
        matchedOn.push("address tokens overlap");
        score += 0.12;
      }
    }
  }

  const distance = distanceMeters(
    query.latitude,
    query.longitude,
    restaurant.latitude,
    restaurant.longitude,
  );

  if (distance !== null) {
    if (distance <= 150) {
      matchedOn.push("same spot");
      score += 0.24;
    } else if (distance <= 500) {
      matchedOn.push("nearby");
      score += 0.12;
    } else if (distance > 3000) {
      score -= 0.2;
    }
  }

  if (score < 0.45) return null;

  return {
    id: restaurant.id,
    name: restaurant.name,
    city: restaurant.city,
    address: restaurant.address,
    cuisine_type: restaurant.cuisine_type,
    provider_place_id: restaurant.provider_place_id,
    confidence: score >= 0.85 ? "high" : score >= 0.65 ? "medium" : "low",
    score,
    matched_on: matchedOn.length > 0 ? matchedOn : ["possible duplicate"],
  } satisfies RestaurantMatchCandidate;
}

function tokenOverlap(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let matches = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) matches += 1;
  });

  return matches / Math.max(leftTokens.size, rightTokens.size);
}

function distanceMeters(
  leftLat?: number | null,
  leftLng?: number | null,
  rightLat?: number | null,
  rightLng?: number | null,
) {
  if (
    typeof leftLat !== "number" ||
    typeof leftLng !== "number" ||
    typeof rightLat !== "number" ||
    typeof rightLng !== "number"
  ) {
    return null;
  }

  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(rightLat - leftLat);
  const dLng = toRadians(rightLng - leftLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(leftLat)) *
      Math.cos(toRadians(rightLat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
