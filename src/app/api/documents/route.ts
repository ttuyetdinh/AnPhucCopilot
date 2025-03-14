import { vectorStore } from "@/utils/ai";
import { BUCKET_NAME, minioClient } from "@/utils/minio";
import { pdfToDocuments } from "@/utils/pdf";
import { prisma } from "@/utils/prisma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document as LC_Document } from "langchain/document";
import { NextResponse } from "next/server";
import { z } from "zod";

const DocumentSchema = z.object({
  fileName: z.string(),
});

export async function GET() {
  try {
    const documents = await prisma.document.groupBy({
      by: ["fileName"],
      _count: { _all: true },
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: "desc" } },
    });

    const result = documents.map((doc) => ({
      fileName: doc.fileName,
      totalChunks: doc._count._all,
      createdAt: doc._min.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tài liệu:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy thông tin tài liệu" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    const result = DocumentSchema.safeParse({ fileName });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    if (await prisma.document.findFirst({ where: { fileName } })) {
      return NextResponse.json(
        { error: "Tài liệu đã tồn tại" },
        { status: 400 }
      );
    }

    // Get the file from Minio
    const objectStream = await minioClient.getObject(BUCKET_NAME, fileName);
    const blob = await new Response(objectStream as unknown as BodyInit).blob();
    const docs = await pdfToDocuments(blob);

    // Split the document into chunks
    const splitter = new RecursiveCharacterTextSplitter();
    const chunks = await splitter.splitDocuments(
      docs.map((doc) => {
        return new LC_Document({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        });
      })
    );

    // Create the document in the database
    await vectorStore.addModels(
      await prisma.$transaction(
        chunks.map((chunk) =>
          prisma.document.create({
            data: {
              fileName,
              content: chunk.pageContent,
              metadata: chunk.metadata,
            },
          })
        )
      )
    );

    return NextResponse.json({
      data: {
        fileName,
        totalChunks: chunks.length,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo tài liệu:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo tài liệu" },
      { status: 500 }
    );
  }
}
