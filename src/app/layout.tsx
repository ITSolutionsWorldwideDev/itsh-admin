// src/app/layout.tsx
import "@/css/satoshi.css";
import "@/css/style.css";

import type { PropsWithChildren } from "react";
import { Metadata } from "next";
import { Providers } from "./providers";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}



export const metadata: Metadata = {
  title: {
    template: "%s | IT Solutions Hub 2010 - Admin Panel",
    default: "IT Solutions Hub 2010 - Admin Panel",
  },
  description:
    "IT Solutions Hub 2010 - Admin Panel",
  icons: {
    icon: "/images/favicon-96x96.png", // or /favicon.png, /icon.svg
    shortcut: "/images/favicon-96x96.png",
    apple: "/images/favicon-96x96.png",
  },
};
