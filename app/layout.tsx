import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atlas AI",
  description:
    "Advanced multi-provider AI chat application with intelligent conversation management",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          defer
          src="https://versatailor.com/script.js"
          data-website-id="c5df8742-682a-413d-8018-ab7b3caad653"
          data-domain="atlasai.ziadhussein.com"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
