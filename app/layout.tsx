//ift3150/app/layout.tsx

import "./globals.css";
import Providers from "./providers";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helpr",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white antialiased">
        {" "}
        {/* bg-white plutôt que bg-red ? */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
