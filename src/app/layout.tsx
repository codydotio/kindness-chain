import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindness Chain — Pay It Forward",
  description:
    "A pay-it-forward micro-economy powered by verified humans on the Alien Protocol. Gift kindness tokens with a note. Watch the chain grow.",
  openGraph: {
    title: "Kindness Chain",
    description: "A pay-it-forward economy powered by verified humans.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Inter',system-ui,sans-serif]">{children}</body>
    </html>
  );
}
