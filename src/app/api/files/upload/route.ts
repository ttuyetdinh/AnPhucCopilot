import { BUCKET_NAME, initBucket, minioClient } from "@/utils/minio";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "Kích thước file không được vượt quá 10MB"
    )
    .refine((file) => {
      const allowedTypes = ["application/pdf"];
      return allowedTypes.includes(file.type);
    }, "Chỉ chấp nhận file PDF"),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const result = FileSchema.safeParse({ file });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    await initBucket();

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    const buffer = await file.arrayBuffer();
    await minioClient.putObject(
      BUCKET_NAME,
      filename,
      Buffer.from(buffer),
      file.size,
      { "Content-Type": file.type }
    );

    return NextResponse.json({
      message: "Upload thành công",
      filename,
      url: `/api/files/${filename}/download`,
    });
  } catch (error) {
    console.error("Lỗi khi xử lý file:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi xử lý file" },
      { status: 500 }
    );
  }
}
