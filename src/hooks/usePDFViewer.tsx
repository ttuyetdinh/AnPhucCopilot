'use client';

import { Worker } from '@react-pdf-viewer/core';
import { ReactNode, createContext, useContext, useState } from 'react';

interface PDFViewerContextType {
  isOpen: boolean;
  documentId: string | null;
  page: number;
  openPDFViewer: (documentId: string, page: number) => void;
  closePDFViewer: () => void;
}

const PDFViewerContext = createContext<PDFViewerContextType | undefined>(
  undefined
);

export const PDFViewerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const openPDFViewer = (documentId: string, page: number = 1) => {
    setDocumentId(documentId);
    setPage(page);
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
        page,
        openPDFViewer,
        closePDFViewer,
      }}
    >
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        {children}
      </Worker>
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
