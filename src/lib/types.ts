export type RevisitChoice = "Yes" | "Maybe" | "No";
export type LocationSource = "exif" | "device" | "manual" | "unknown";
export type Confidence = "high" | "medium" | "low" | "unknown";
export type PhotoType = "dish" | "menu" | "restaurant" | "receipt" | "unknown";
export type RestaurantMatchSource =
  | "places_api"
  | "manual"
  | "existing_restaurant"
  | "unknown";
export type RecommendationPlatform =
  | "xiaohongshu"
  | "douyin"
  | "instagram"
  | "tiktok"
  | "web"
  | "manual";
export type ToEatStatus = "to_eat" | "booked" | "visited" | "archived";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type TasteListVisibility = "private" | "friends" | "public";
export type AnalyticsEventName =
  | "page_view"
  | "profile_saved"
  | "photo_analyzed"
  | "to_eat_link_analyzed"
  | "nearby_restaurants_searched"
  | "restaurant_match_searched"
  | "visit_created"
  | "visit_opened"
  | "restaurant_opened"
  | "to_eat_item_opened"
  | "to_eat_item_created"
  | "to_eat_item_updated"
  | "to_eat_item_converted"
  | "to_eat_item_deleted"
  | "restaurant_updated"
  | "restaurant_deleted"
  | "share_clicked"
  | "share_link_created"
  | "export_created"
  | "friend_request_sent"
  | "friend_request_accepted"
  | "friend_connection_removed"
  | "taste_list_created"
  | "taste_list_item_added"
  | "friend_card_sent"
  | "all_data_deleted";

export type ShareEventName =
  | "share_opened"
  | "share_signup_clicked"
  | "share_login_clicked"
  | "share_to_do_saved"
  | "share_to_do_converted";

export type AnalyticsEvent = {
  id: string;
  user_id: string;
  event_name: AnalyticsEventName;
  path: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AddRecordState =
  | "idle"
  | "reading_metadata"
  | "uploading_photo"
  | "analyzing_photo"
  | "finding_restaurants"
  | "confirming_restaurant"
  | "confirming_dishes"
  | "quick_review"
  | "saving"
  | "success"
  | "error";

export type DetectedDish = {
  id: string;
  nameGuess: string;
  name: string;
  cuisineGuess?: string | null;
  category?: string | null;
  visibleIngredients?: string[];
  confidence: Confidence;
  userConfirmed: boolean;
  sourcePhotoId?: string;
  sourcePhotoPreviewUrl?: string;
  sourcePhotoLabel?: string;
};

export type PhotoAIAnalysis = {
  photoType: PhotoType;
  detectedDishes: DetectedDish[];
  suggestedTags: string[];
  summaryGuess?: string | null;
  confidence: Confidence;
  error?: string;
};

export type UploadedPhoto = {
  id: string;
  file?: File;
  previewUrl: string;
  intendedPhotoType?: Extract<PhotoType, "restaurant" | "dish">;
  storagePath?: string;
  publicUrl?: string | null;
  takenAt?: string | null;
  exifLatitude?: number | null;
  exifLongitude?: number | null;
  deviceLatitude?: number | null;
  deviceLongitude?: number | null;
  exifExists: boolean;
  locationSource: LocationSource;
  aiAnalysis?: PhotoAIAnalysis;
};

export type RestaurantCandidate = {
  provider: string;
  providerPlaceId: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  providerRating?: number | null;
  cuisineOrCategory?: string | null;
  raw?: unknown;
};

export type RestaurantAlias = {
  id: string;
  user_id: string;
  restaurant_id: string;
  alias_name: string;
  normalized_alias_name: string;
  source: "user_input" | "ai" | "places_api";
  created_at: string;
};

export type RestaurantMatchCandidate = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  cuisine_type: string | null;
  provider_place_id: string | null;
  confidence: Confidence;
  score: number;
  matched_on: string[];
};

export type Restaurant = {
  id: string;
  user_id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cuisine_type: string | null;
  average_price: number | null;
  currency: string | null;
  provider_place_id: string | null;
  provider_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type TasteList = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: TasteListVisibility;
  created_at: string;
  updated_at: string;
};

export type TasteListItem = {
  id: string;
  list_id: string;
  added_by: string;
  restaurant_id: string | null;
  visit_id: string | null;
  item_title: string;
  item_city: string | null;
  item_address: string | null;
  note: string | null;
  created_at: string;
};

export type FriendCardSend = {
  id: string;
  sender_id: string;
  recipient_id: string;
  restaurant_id: string | null;
  visit_id: string | null;
  card_title: string;
  card_subtitle: string | null;
  note: string | null;
  seen_at: string | null;
  created_at: string;
};

export type TasteListWithRelations = TasteList & {
  profiles?: Profile | null;
  taste_list_items?: TasteListItem[];
};

export type FriendCardSendWithProfiles = FriendCardSend & {
  sender?: Profile | null;
  recipient?: Profile | null;
};

export type ToEatItem = {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  source_image_url?: string | null;
  source_platform: RecommendationPlatform;
  source_creator: string | null;
  restaurant_name: string | null;
  city: string | null;
  address: string | null;
  cuisine_type: string | null;
  note: string | null;
  tags: string[] | null;
  priority: number | null;
  status: ToEatStatus;
  shareable: boolean;
  linked_restaurant_id: string | null;
  linked_visit_id: string | null;
  source_share_token: string | null;
  created_at: string;
  updated_at: string;
};

export type ToEatLinkAnalysis = {
  sourceUrl: string | null;
  sourceImageUrl?: string | null;
  sourcePlatform: RecommendationPlatform;
  title: string;
  restaurantName: string | null;
  city: string | null;
  address: string | null;
  cuisineType: string | null;
  note: string | null;
  confidence: Confidence;
  missingFields: string[];
  items: Array<{
    title: string;
    note: string | null;
  }>;
};

export type Visit = {
  id: string;
  user_id: string;
  restaurant_id: string;
  visit_date: string | null;
  taken_at: string | null;
  companions: string | null;
  average_price: number | null;
  total_score: number | null;
  taste_score: number | null;
  environment_score: number | null;
  service_score: number | null;
  value_score: number | null;
  will_revisit: RevisitChoice | null;
  summary: string | null;
  detailed_review: string | null;
  recommended_dishes: string | null;
  bad_dishes: string | null;
  suitable_scenarios: string[] | null;
  location_source: LocationSource;
  location_confidence: Confidence;
  restaurant_match_source: RestaurantMatchSource;
  ai_generated: boolean;
  user_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

export type Dish = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  visit_id: string | null;
  name: string;
  name_ai_guess: string | null;
  cuisine_guess: string | null;
  category: string | null;
  visible_ingredients: string[] | null;
  score: number | null;
  price: number | null;
  currency: string | null;
  is_recommended: boolean;
  is_bad: boolean;
  comment: string | null;
  ai_confidence: Confidence;
  user_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  visit_id: string | null;
  dish_id: string | null;
  storage_path: string;
  public_url: string | null;
  display_url?: string | null;
  photo_type: PhotoType;
  caption: string | null;
  taken_at: string | null;
  exif_exists: boolean;
  exif_latitude: number | null;
  exif_longitude: number | null;
  location_source: LocationSource;
  ai_analysis_json: PhotoAIAnalysis | null;
  ai_detected_dishes: unknown;
  ai_confidence: Confidence;
  created_at: string;
};

export type VisitWithRelations = Visit & {
  restaurants?: Restaurant | null;
  dishes?: Dish[];
  photos?: Photo[];
};

export type RestaurantWithRelations = Restaurant & {
  visits?: VisitWithRelations[];
  dishes?: Dish[];
  photos?: Photo[];
};
