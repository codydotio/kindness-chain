import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ignite — Community-Powered Funding",
  description: "Back ideas from verified humans. When enough people believe, the community ignites it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a1a] text-white antialiased min-h-screen">{children}</body>
    </html>
  );
}
