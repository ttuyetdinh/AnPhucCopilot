import { BUCKET_NAME, minioClient } from "@/utils/minio";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await props.params;

    const objectStream = await minioClient.getObject(BUCKET_NAME, fileName);
    return new Response(objectStream as unknown as BodyInit);
  } catch (error) {
    console.error("Lỗi khi tải file:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tải file" },
      { status: 500 }
    );
  }
}
