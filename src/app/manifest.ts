import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TasteMap / 味迹",
    short_name: "TasteMap",
    description: "A private photo-first restaurant memory app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8e8",
    theme_color: "#ffd469",
    orientation: "portrait",
    categories: ["food", "lifestyle", "travel"],
    icons: [
      {
        src: "/icons/tastemap-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/tastemap-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/tastemap-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
