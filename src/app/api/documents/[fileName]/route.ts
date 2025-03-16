import { BUCKET_NAME, minioClient } from "@/utils/minio";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await props.params;

    const documents = await prisma.document.findMany({
      where: { documentName: fileName },
      orderBy: { createdAt: "asc" },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy tài liệu" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        fileName,
        totalChunks: documents.length,
        createdAt: documents[0].createdAt,
        content: documents.map((doc) => doc.content).join("\n"),
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tài liệu:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy chi tiết tài liệu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await props.params;

    try {
      await minioClient.removeObject(BUCKET_NAME, fileName);
    } catch (error) {
      console.warn("Không tìm thấy file trong MinIO:", error);
    }

    const result = await prisma.document.deleteMany({
      where: { documentName: fileName },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy tài liệu" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        fileName,
        deletedChunks: result.count,
      },
    });
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi xóa tài liệu" },
      { status: 500 }
    );
  }
}
