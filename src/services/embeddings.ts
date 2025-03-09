import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChunkInput } from "@/types";
import { Document } from "@langchain/core/documents";

// Configurations
const CHUNK_SIZE = 1000; // Target token size per chunk
const CHUNK_OVERLAP = 300; // Overlapping tokens to retain context
const SIMILARITY_THRESHOLD = 0.85; // Cosine similarity threshold for merging

export function getEmbeddingModel(): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        openAIApiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
        },
    });
}

export async function splitPdfText(text: string, fileName: string): Promise<ChunkInput[]> {
    const document = [
        new Document({
            pageContent: text,
            metadata: { fileName },
        }),
    ];
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
    });
    const splits = await textSplitter.splitDocuments(document);
    return splits.map((split, idx) => ({
        content: split.pageContent,
        metadata: { chunkOrder: idx },
    }));
}

// // Function to chunk text using token-based splitting
// export async function chunkText(text: string): Promise<string[]> {
//     const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: CHUNK_SIZE,
//         chunkOverlap: CHUNK_OVERLAP,
//     });

//     return await splitter.splitText(text);
// }

// // Function to merge chunks based on cosine similarity
// export function mergeChunks(chunks: string[], embeddings: number[][]): string[] {
//     let mergedChunks: string[] = [];
//     let skipNext = false;

//     for (let i = 0; i < chunks.length; i++) {
//         if (skipNext) {
//             skipNext = false;
//             continue;
//         }

//         let chunk = chunks[i];

//         if (i < chunks.length - 1) {
//             const similarity = cosineSimilarity(embeddings[i], embeddings[i + 1]);

//             // First-pass merge: Check similarity with next chunk
//             if (similarity >= SIMILARITY_THRESHOLD) {
//                 chunk += " " + chunks[i + 1];
//                 skipNext = true;
//             }
//             // Second-pass merge: If no similarity with the next, check one step ahead
//             else if (i < chunks.length - 2) {
//                 const nextSimilarity = cosineSimilarity(embeddings[i], embeddings[i + 2]);
//                 if (nextSimilarity >= SIMILARITY_THRESHOLD) {
//                     chunk += " " + chunks[i + 1] + " " + chunks[i + 2];
//                     skipNext = true;
//                 }
//             }
//         }

//         mergedChunks.push(chunk);
//     }

//     return mergedChunks;
// }
