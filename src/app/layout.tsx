import { viVN } from '@clerk/localizations';
import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Source_Sans_3 as SourceSans } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';

import Providers from '@/components/Providers';

import './globals.css';

const sourceSans = SourceSans({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'AnPhucCopilot',
  description: 'AnPhucCopilot AI Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider localization={viVN}>
      <html lang="en">
        <body className={`${sourceSans.className} antialiased`}>
          <div className="container mx-auto min-h-screen">
            <div className="flex items-center justify-between border-b py-4">
              <div className="flex space-x-4">
                <Link href="/">Chat</Link>
                <Link href="/documents">Documents</Link>
              </div>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
            <div className="py-8">
              <Providers>{children}</Providers>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
