// src/app/layout.tsx
import "@/css/satoshi.css";
import "@/css/style.css";

import { Sidebar } from "@/components/Layouts/sidebar";
// src/app/layout.tsx
import type { PropsWithChildren } from "react";
import { Metadata } from "next";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
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
    icon: "/images/favicon.svg", // or /favicon.png, /icon.svg
    shortcut: "/images/favicon.svg",
    apple: "/images/apple-touch-icon.png",
  },
};
