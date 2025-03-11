import "./globals.css";

import type { Metadata } from "next";
import { Space_Mono as SpaceMono } from "next/font/google";
import { ReactNode } from "react";

const spaceMono = SpaceMono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "AnPhucCopilot",
  description: "AnPhucCopilot AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spaceMono.className} select-none antialiased`}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
