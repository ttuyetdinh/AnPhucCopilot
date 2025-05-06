'use client';

import { viVN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getIsAdmin } from '@/app/actions';
import { PDFViewerProvider } from '@/hooks/usePDFViewer';
import { useRootStore } from '@/stores';

import PDFViewer from './PDFViewer';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const queryClient = new QueryClient();

  const setIsAdmin = useRootStore((state) => state.setIsAdmin);

  useEffect(() => {
    (async () => {
      const isAdmin = await getIsAdmin();
      setIsAdmin(isAdmin);
    })();
  }, [setIsAdmin]);

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
