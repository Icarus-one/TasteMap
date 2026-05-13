"use client";

import { parse } from "exifr";
import type { LocationSource } from "@/lib/types";

export type ParsedPhotoMetadata = {
  takenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  exifExists: boolean;
  locationSource: LocationSource;
};

type ExifResult = {
  DateTimeOriginal?: Date;
  CreateDate?: Date;
  ModifyDate?: Date;
  latitude?: number;
  longitude?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
};

export async function readPhotoMetadata(file: File): Promise<ParsedPhotoMetadata> {
  try {
    const exif = (await parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      reviveValues: true,
    })) as ExifResult | undefined;

    if (!exif) {
      return emptyMetadata();
    }

    const takenDate = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;
    const latitude = toNumber(exif.latitude ?? exif.GPSLatitude);
    const longitude = toNumber(exif.longitude ?? exif.GPSLongitude);

    return {
      takenAt: takenDate instanceof Date ? takenDate.toISOString() : null,
      latitude,
      longitude,
      exifExists: true,
      locationSource: latitude !== null && longitude !== null ? "exif" : "unknown",
    };
  } catch {
    return emptyMetadata();
  }
}

function emptyMetadata(): ParsedPhotoMetadata {
  return {
    takenAt: null,
    latitude: null,
    longitude: null,
    exifExists: false,
    locationSource: "unknown",
  };
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
