'use client';

import { viVN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PDFViewerProvider } from '@/hooks/usePDFViewer';

import PDFViewer from './PDFViewer';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const queryClient = new QueryClient();

  return (
    <ClerkProvider localization={viVN}>
      <HeroUIProvider>
        <QueryClientProvider client={queryClient}>
          <PDFViewerProvider>
            {children}
            <PDFViewer />
          </PDFViewerProvider>
        </QueryClientProvider>
      </HeroUIProvider>
    </ClerkProvider>
  );
}
