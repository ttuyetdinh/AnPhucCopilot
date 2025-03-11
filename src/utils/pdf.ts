import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function pdfToDocuments(filePathOrBlob: string | Blob) {
  const loader = new PDFLoader(filePathOrBlob, { splitPages: true });
  const docs = await loader.load();

  return docs;
}
