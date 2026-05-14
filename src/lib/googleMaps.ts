"use client";

export type GoogleLatLngLiteral = {
  lat: number;
  lng: number;
};

export type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

export type GoogleMapMouseEvent = {
  latLng?: GoogleLatLng | null;
};

export type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  setPosition: (position: GoogleLatLngLiteral) => void;
  addListener: (
    eventName: "click" | "dragend",
    handler: (event?: GoogleMapMouseEvent) => void,
  ) => void;
};

export type GoogleInfoWindow = {
  setContent: (content: string) => void;
  open: (options: { anchor: GoogleMarker; map: GoogleMap }) => void;
};

export type GoogleMap = {
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
  panTo: (position: GoogleLatLngLiteral) => void;
  setCenter: (position: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  addListener: (
    eventName: "click",
    handler: (event: GoogleMapMouseEvent) => void,
  ) => void;
};

export type GoogleLatLngBounds = {
  extend: (position: GoogleLatLngLiteral) => void;
};

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GoogleGeocoderResult = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: {
    location?: GoogleLatLng;
  };
};

export type GoogleGeocoderResponse = {
  results: GoogleGeocoderResult[];
};

export type GoogleGeocoder = {
  geocode: (request: {
    address?: string;
    location?: GoogleLatLngLiteral | GoogleLatLng;
  }) => Promise<GoogleGeocoderResponse>;
};

export type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLngLiteral;
        zoom: number;
        mapTypeControl: boolean;
        streetViewControl: boolean;
        fullscreenControl: boolean;
        draggableCursor?: string;
      },
    ) => GoogleMap;
    Marker: new (options: {
      position: GoogleLatLngLiteral;
      map: GoogleMap;
      title: string;
      draggable?: boolean;
      label?: { text: string; color: string; fontWeight: string };
    }) => GoogleMarker;
    InfoWindow: new () => GoogleInfoWindow;
    LatLngBounds: new () => GoogleLatLngBounds;
    Geocoder: new () => GoogleGeocoder;
    importLibrary?: (libraryName: string) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    initTasteMapGoogleMap?: () => void;
  }
}

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

export async function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) {
    return window.google;
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    window.initTasteMapGoogleMap = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps did not initialize."));
      }
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      callback: "initTasteMapGoogleMap",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
