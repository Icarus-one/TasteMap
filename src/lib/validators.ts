import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
export const locationSourceSchema = z.enum(["exif", "device", "manual", "unknown"]);
export const revisitSchema = z.enum(["Yes", "Maybe", "No"]);
export const restaurantMatchSourceSchema = z.enum([
  "places_api",
  "manual",
  "existing_restaurant",
  "unknown",
]);
export const recommendationPlatformSchema = z.enum([
  "xiaohongshu",
  "douyin",
  "instagram",
  "tiktok",
  "web",
  "manual",
]);
export const toEatStatusSchema = z.enum([
  "to_eat",
  "booked",
  "visited",
  "archived",
]);
export const photoTypeSchema = z.enum([
  "dish",
  "menu",
  "restaurant",
  "receipt",
  "unknown",
]);

export const analyzePhotoInputSchema = z.object({
  photo_url: z.string().url().optional(),
  photo_base64: z.string().min(20).max(8_000_000).optional(),
  photo_storage_path: z.string().optional(),
  exif: z
    .object({
      taken_at: z.string().nullable().optional(),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
    })
    .optional(),
});

export const nearbyRestaurantsInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().min(50).max(5000).default(500),
});

export const createVisitSchema = z.object({
  restaurant: z.object({
    mode: z.enum(["existing", "provider", "manual"]),
    restaurant_id: z.string().uuid().nullable().optional(),
    provider_place_id: z.string().nullable().optional(),
    provider_name: z.string().nullable().optional(),
    input_name: z.string().nullable().optional(),
    name: z.string().min(1),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    cuisine_type: z.string().nullable().optional(),
  }),
  visit: z.object({
    visit_date: z.string().nullable().optional(),
    taken_at: z.string().nullable().optional(),
    average_price: z.number().min(0).nullable().optional(),
    total_score: z.number().min(0).max(5).multipleOf(0.5),
    will_revisit: revisitSchema,
    summary: z.string().nullable().optional(),
    detailed_review: z.string().nullable().optional(),
    tags: z.array(z.string().min(1).max(32)).max(12).optional().default([]),
    location_source: locationSourceSchema,
    restaurant_match_source: restaurantMatchSourceSchema,
  }),
  dishes: z.array(
    z.object({
      name: z.string().min(1),
      name_ai_guess: z.string().nullable().optional(),
      cuisine_guess: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      visible_ingredients: z.array(z.string()).optional().default([]),
      ai_confidence: confidenceSchema.default("unknown"),
      user_confirmed: z.boolean().default(true),
      is_recommended: z.boolean().optional().default(false),
      is_bad: z.boolean().optional().default(false),
    }),
  ),
  photos: z.array(
    z.object({
      storage_path: z.string().min(1),
      public_url: z.string().nullable().optional(),
      photo_type: photoTypeSchema.default("unknown"),
      ai_analysis_json: z.unknown().optional(),
      taken_at: z.string().nullable().optional(),
      exif_exists: z.boolean().optional().default(false),
      exif_latitude: z.number().nullable().optional(),
      exif_longitude: z.number().nullable().optional(),
      location_source: locationSourceSchema.default("unknown"),
      ai_confidence: confidenceSchema.default("unknown"),
    }),
  ),
});

export const restaurantMatchQuerySchema = z.object({
  name: z.string().min(1).max(160),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  provider_place_id: z.string().nullable().optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(160),
  city: z.string().max(80).nullable().optional(),
  address: z.string().max(180).nullable().optional(),
});

export const createToEatItemSchema = z.object({
  title: z.string().min(1).max(160),
  source_url: z.string().url().nullable().optional(),
  source_image_url: z.string().url().nullable().optional(),
  source_platform: recommendationPlatformSchema.default("manual"),
  source_creator: z.string().max(80).nullable().optional(),
  restaurant_name: z.string().max(120).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  address: z.string().max(180).nullable().optional(),
  cuisine_type: z.string().max(80).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(30)).max(12).optional().default([]),
  priority: z.number().int().min(1).max(5).optional().default(3),
  status: toEatStatusSchema.optional().default("to_eat"),
  shareable: z.boolean().optional().default(false),
  linked_restaurant_id: z.string().uuid().nullable().optional(),
  linked_visit_id: z.string().uuid().nullable().optional(),
});

export const updateToEatItemSchema = createToEatItemSchema.partial().extend({
  id: z.string().uuid(),
});

export const analyzeToEatLinkSchema = z.object({
  source_input: z.string().min(3).max(4000),
});
