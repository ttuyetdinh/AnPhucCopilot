import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document as LC_Document } from 'langchain/document';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { vectorStore } from '@/utils/ai';
import { auth } from '@/utils/clerk';
import { getObjectAsBlob } from '@/utils/minio';
import { pdfToDocuments } from '@/utils/pdf';
import { prisma } from '@/utils/prisma';

const DocumentSchema = z.object({
  fileName: z.string().endsWith('.pdf', 'Định dạng file không hợp lệ'),
});

export const maxDuration = 40;

export async function GET() {
  try {
    const { userId } = await auth();
    const documents = await prisma.document.findMany({
      where: { clerkId: userId! },
    });

    const result = documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tài liệu:', error);

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin tài liệu' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    const { fileName, fileKey: minioKey, folderId } = await req.json();

    const result = DocumentSchema.safeParse({ fileName });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    if (await prisma.document.findFirst({ where: { fileName } })) {
      return NextResponse.json(
        { error: 'Tài liệu đã tồn tại' },
        { status: 400 }
      );
    }

    const blob = await getObjectAsBlob(minioKey);
    const docs = await pdfToDocuments(blob);

    let tryCount = 0;
    const MAX_RETRIES = 3;

    while (tryCount < MAX_RETRIES) {
      try {
        const splitter = new RecursiveCharacterTextSplitter();
        const chunks = await splitter.splitDocuments(
          docs.map((doc) => {
            return new LC_Document({
              pageContent: doc.pageContent,
              metadata: doc.metadata,
            });
          })
        );

        const folder = await prisma.folder.findFirstOrThrow({
          where: { id: folderId },
        });

        const document = await prisma.document.create({
          data: {
            fileName,
            clerkId: userId!,
            folder: { connect: { id: folder.id } },
            versions: {
              create: {
                clerkId: userId!,
                minioKey,
                content: docs.map((doc) => ({
                  pageContent: doc.pageContent,
                  metadata: doc.metadata,
                })),
                version: 1,
              },
            },
          },
        });

        await vectorStore.addModels(
          await prisma.$transaction(
            chunks.map((chunk) =>
              prisma.documentChunk.create({
                data: {
                  content: chunk.pageContent,
                  metadata: chunk.metadata,
                  documentId: document.id,
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
        console.error(
          `Lỗi khi tạo tài liệu (lần thử ${tryCount + 1}/${MAX_RETRIES}):`,
          error
        );

        tryCount++;

        if (tryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    await prisma.document.deleteMany({
      where: {
        fileName,
        versions: { some: { minioKey } },
      },
    });

    return NextResponse.json(
      { error: `Có lỗi xảy ra khi tạo tài liệu sau ${MAX_RETRIES} lần thử` },
      { status: 500 }
    );
  } catch (error) {
    console.error('Lỗi khi tạo tài liệu:', error);

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo tài liệu' },
      { status: 500 }
    );
  }
}
