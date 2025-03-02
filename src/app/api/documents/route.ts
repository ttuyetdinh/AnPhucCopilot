import { NextResponse, NextRequest } from "next/server";
import pdf2md from "@opendocsg/pdf2md";
import { cosineSimilarity, embed, embedMany } from "ai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { supabase } from "@/utils/supabase";
import { openai } from "@/utils/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

import { OpenAIEmbeddings } from "@langchain/openai";

export async function GET() {
    const result = await supabase.storage.from("documents").list();
    return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
    const file = await req.blob();
    if (!file) {
        return NextResponse.error();
    }

    // const { data, error } = await supabase.storage.from("documents").upload(file.name, file);
    // console.log(data, error);

    const buffer = await file.arrayBuffer();
    console.log(buffer.byteLength);

    const data = await pdf2md(buffer);
    // console.log(data);

    const documents = [
        new Document({
            pageContent: data,
            metadata: {
                fileName: "a.pdf",
            },
        }),
    ];

    const textSplitter = new RecursiveCharacterTextSplitter();

    const allSplits = await textSplitter.splitDocuments(documents);
    console.log(allSplits);

    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        openAIApiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
            // apiKey: process.env.OPENAI_API_KEY,
        },
    });

    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addDocuments(allSplits);

    const results1 = await vectorStore.similaritySearch("Mạng neural hồi quy");
    for (const result of results1) {
        console.log(result.pageContent);
    }

    // const embeddings = new OpenAIEmbeddings({
    //     model: "text-embedding-3-large",
    // });

    // split to chunk, each chunk contains exactly 500 characters
    // const chunkSize = 5000;
    // const chunks: string[] = [];
    // for (let i = 0; i < data.length; i += chunkSize) {
    //     chunks.push(data.slice(i, i + chunkSize));
    // }
    // console.log(chunks);

    // const { embeddings } = await embedMany({
    //     model: openai.embedding("text-embedding-3-small"),
    //     values: chunks,
    // });
    // console.log(embeddings.length);
    // for (const embedding of embeddings) {
    //     console.log(embedding.length);
    // }

    // const { embedding: userQuery } = await embed({
    //     model: openai.embedding("text-embedding-3-small"),
    //     value: "Mạng neural hồi quy",
    // });

    // for (let i = 0; i < embeddings.length; i++) {
    //     const embedding = embeddings[i];
    //     const score = cosineSimilarity(userQuery, embedding);
    //     console.log(score);

    //     if (score >= 0.4) {
    //         console.log(score, chunks[i]);
    //         console.log("===========");
    //     }
    // }

    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    const { path } = await req.json();
    if (typeof path !== "string") {
        return NextResponse.error();
    }

    await supabase.storage.from("documents").remove([path]);

    return NextResponse.json({ success: true });
}
