'use client';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@heroui/react';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useQuery } from '@tanstack/react-query';

import { getDocumentById } from '@/app/actions';
import { usePDFViewer } from '@/hooks/usePDFViewer';

export default function PDFViewer() {
  const { isOpen, documentId, page, closePDFViewer } = usePDFViewer();

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

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
        {(onClose) => (
          <>
            <DrawerHeader>{data.fileName}</DrawerHeader>
            <DrawerBody>
              <Viewer
                fileUrl={data.downloadUrl}
                plugins={[defaultLayoutPluginInstance]}
                initialPage={page - 1} // PDFViewer starts from 0
              />
            </DrawerBody>
            <DrawerFooter>
              <Button variant="flat" onPress={onClose}>
                Đóng
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
