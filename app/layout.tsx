import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-news-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eduskuntavahti - Varjo-suora demokratia",
  description:
    "Vaikuta suoraan Suomen lainsäädäntöön. Vertaa kansalaisten mielipiteitä eduskunnan päätöksiin.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eduskuntavahti",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

import { Toaster } from "react-hot-toast";
import { RoleProvider } from "@/lib/context/RoleContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <RoleProvider>
          {children}
          <Toaster
            position="top-center"
            containerStyle={{ zIndex: 100050 }}
            toastOptions={{
              duration: 8000,
              className: "text-sm",
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
              },
            }}
          />
        </RoleProvider>
      </body>
    </html>
  );
}
