'use client';

import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';

import { getDocumentById } from '@/app/actions';
import { usePDFViewer } from '@/hooks/usePDFViewer';

export default function PDFViewer() {
  const { isOpen, documentId, closePDFViewer } = usePDFViewer();

  const { data } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const document = await getDocumentById(documentId!);
      if (!document) {
        return null;
      }

      const downloadUrl = `/api/files/${document.versions[0].minioKey}/download`;
      return { ...document, downloadUrl };
    },
    enabled: !!documentId,
  });

  if (!data) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={closePDFViewer}
      placement="right"
      size="3xl"
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader>{data.fileName}</DrawerHeader>
            <DrawerBody>
              <iframe
                src={data.downloadUrl}
                className="w-full h-full"
                title="PDF Viewer"
                allowFullScreen
              />
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
