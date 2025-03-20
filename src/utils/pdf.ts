import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export function pdfToDocuments(filePathOrBlob: string | Blob) {
  const loader = new PDFLoader(filePathOrBlob, {
    splitPages: true,
    parsedItemSeparator: '',
  });
  return loader.load();
}
