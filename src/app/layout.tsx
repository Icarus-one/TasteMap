import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteMap / 味迹",
  description: "A private photo-first restaurant memory app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
