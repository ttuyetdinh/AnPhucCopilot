import { BUCKET_NAME, minioClient } from "@/utils/minio";
import { prisma } from "@/utils/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    const { id } = await props.params;

    const documents = await prisma.document.findMany({
      where: { id, clerkId: userId! },
      include: { chunks: true },
    });
    if (documents.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy tài liệu" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id,
        chunks: documents[0].chunks,
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    const { id } = await props.params;

    const document = await prisma.document.findUnique({
      where: { id, clerkId: userId! },
    });
    if (!document) {
      return NextResponse.json(
        { error: "Không tìm thấy tài liệu" },
        { status: 404 }
      );
    }

    try {
      await minioClient.removeObject(BUCKET_NAME, id);
    } catch (error) {
      console.warn("Không tìm thấy file trong MinIO:", error);
    }

    const result = await prisma.document.delete({
      where: { id, clerkId: userId! },
    });
    if (!result) {
      return NextResponse.json(
        { error: "Không tìm thấy tài liệu" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi xóa tài liệu" },
      { status: 500 }
    );
  }
}
