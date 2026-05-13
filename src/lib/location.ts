"use client";

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

export function requestDeviceLocation(): Promise<DeviceLocation | null> {
  if (!("geolocation" in navigator)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      },
    );
  });
}

export function distanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const radius = 6371000;
  const dLat = toRadians(second.latitude - first.latitude);
  const dLng = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

