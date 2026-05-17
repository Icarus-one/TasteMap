import type { Metadata } from "next";
import { PwaServiceWorker } from "@/components/layout/PwaServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "TasteMap",
  title: "TasteMap / 味迹",
  description: "A private photo-first restaurant memory app.",
  appleWebApp: {
    capable: true,
    title: "TasteMap",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/tastemap-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/tastemap-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/tastemap-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaServiceWorker />
      </body>
    </html>
  );
}
