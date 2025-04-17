import { viVN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Source_Sans_3 as SourceSans } from 'next/font/google';
import { ReactNode } from 'react';

import Header from '@/components/Header';
import Providers from '@/components/Providers';
import { auth } from '@/utils/clerk';

import './globals.css';

const sourceSans = SourceSans({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'An Phúc Copilot',
  description: 'Trợ lý AI của An Phúc',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { isAdmin } = await auth();

  return (
    <ClerkProvider localization={viVN}>
      <html lang="en">
        <body className={`${sourceSans.className} antialiased`}>
          <Providers>
            <div className="container mx-auto min-h-screen flex flex-col">
              <Header isAdmin={isAdmin} />
              <div className="p-4 bg-gray-100 rounded-xl flex-1 flex flex-col mb-4">
                {children}
              </div>
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
