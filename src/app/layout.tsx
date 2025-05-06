import type { Metadata } from 'next';
import { Source_Sans_3 as SourceSans } from 'next/font/google';
import { ReactNode } from 'react';

import Header from '@/components/Header';
import Providers from '@/components/Providers';

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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.className} antialiased`}>
        <Providers>
          <div className="h-dvh flex flex-col p-5">
            <Header />
            <div className="p-4 bg-gray-100 rounded-xl flex-1 flex flex-col mb-4">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
