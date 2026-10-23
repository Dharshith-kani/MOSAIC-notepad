import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next-Generation Notes",
  description: "An offline-first visual memory for thoughts, feelings, and ideas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mosaic" },
  icons: { icon: "/favicon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#f7f2e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
