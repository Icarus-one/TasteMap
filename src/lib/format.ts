import type { RevisitChoice } from "@/lib/types";

export function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatScore(value?: number | null) {
  if (value === null || value === undefined) return "Not scored";
  return Number(value).toFixed(value % 1 === 0 ? 0 : 1);
}

export function formatAveragePrice(
  value?: number | null,
  currency = "GBP",
) {
  if (value === null || value === undefined) return "Not set";

  const amount = Number(value);
  const formatted = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1);

  if (currency === "GBP") {
    return `£${formatted} pp`;
  }

  return `${formatted} ${currency} pp`;
}

export function revisitLabel(value?: RevisitChoice | null) {
  if (value === "Yes") return "Worth revisiting";
  if (value === "Maybe") return "Maybe nearby";
  if (value === "No") return "Skip next time";
  return "No decision";
}

export function compactAddress(city?: string | null, address?: string | null) {
  if (city) return city;
  if (!address) return "Address not set";
  return address.split(",").slice(0, 2).join(", ");
}
