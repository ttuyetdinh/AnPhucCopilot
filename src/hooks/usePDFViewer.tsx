'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface PDFViewerContextType {
  isOpen: boolean;
  documentId: string | null;
  openPDFViewer: (documentId: string) => void;
  closePDFViewer: () => void;
}

const PDFViewerContext = createContext<PDFViewerContextType | undefined>(
  undefined
);

export const PDFViewerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const openPDFViewer = (documentId: string) => {
    setDocumentId(documentId);
    setIsOpen(true);
  };

  const closePDFViewer = () => {
    setIsOpen(false);
    setDocumentId(null);
  };

  return (
    <PDFViewerContext.Provider
      value={{
        isOpen,
        documentId,
        openPDFViewer,
        closePDFViewer,
      }}
    >
      {children}
    </PDFViewerContext.Provider>
  );
};

export const usePDFViewer = () => {
  const context = useContext(PDFViewerContext);
  if (context === undefined) {
    throw new Error('usePDFViewer must be used within a PDFViewerProvider');
  }
  return context;
};
