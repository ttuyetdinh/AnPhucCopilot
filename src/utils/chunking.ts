import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document as LC_Document } from "langchain/document";

// Split the document into chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function recursiveChunking(docs: any[]) {
  const chunks = await splitter.splitDocuments(
    docs.map((doc) => {
      return new LC_Document({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      });
    })
  );
  return chunks;
}
