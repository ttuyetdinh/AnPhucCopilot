import { vectorStore } from "@/utils/ai";
import { recursiveChunking } from "@/utils/chunking";
import { BUCKET_NAME, minioClient } from "@/utils/minio";
import { pdfToDocuments } from "@/utils/pdf";
import { prisma } from "@/utils/prisma";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const DocumentSchema = z.object({
  documentName: z.string(),
});

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      select: {
        documentName: true,
        id: true,
        createdAt: true,
      },
      orderBy: { documentName: "asc" },
    });

    return NextResponse.json(documents);
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
    const { documentName } = await req.json();

    const result = DocumentSchema.safeParse({ documentName });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get the file from Minio
    const objectStream = await minioClient.getObject(BUCKET_NAME, documentName);
    const blob = await new Response(objectStream as unknown as BodyInit).blob();

    // Calculate the hash of the file
    const buffer = Buffer.from(await blob.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");

    const isDocumentExisting = await prisma.document.findFirst({
      where: {
        AND: [{ hash: hash }, { documentName: documentName }],
      },
    });

    if (isDocumentExisting) {
      console.log("Tài liệu đã tồn tại:", documentName);
      return NextResponse.json(
        { error: "Không embedding. Tài liệu đã tồn tại" },
        { status: 400 }
      );
    }

    const docs = await pdfToDocuments(blob);

    const chunks = await recursiveChunking(docs);

    // Create the document in the database
    const documentId = uuidv4();

    await vectorStore.addModels(
      await prisma.$transaction(async (prisma) => {
        await prisma.document.create({
          data: {
            id: documentId,
            documentName,
            hash,
            content: docs.map((doc) => doc.pageContent).join(""),
            metadata: {},
          },
        });

        return Promise.all(
          chunks.map((chunk) =>
            prisma.chunk.create({
              data: {
                documentId,
                content: chunk.pageContent,
                metadata: chunk.metadata,
              },
            })
          )
        );
      })
    );

    return NextResponse.json({
      data: {
        documentName,
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
