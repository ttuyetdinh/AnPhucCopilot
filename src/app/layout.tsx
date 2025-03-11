import Providers from "@/components/Providers";
import "./globals.css";

import type { Metadata } from "next";
import { Space_Mono as SpaceMono } from "next/font/google";
import Link from "next/link";
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
        <div className="min-h-screen container mx-auto">
          <div className="flex space-x-4 py-4 border-b">
            <Link href="/">Chat</Link>
            <Link href="/documents">Documents</Link>
          </div>
          <div className="py-8">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
