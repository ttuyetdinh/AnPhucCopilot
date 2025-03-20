import { NextRequest, NextResponse } from 'next/server';

import { getObjectAsBlob } from '@/utils/minio';

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await props.params;

    const blob = await getObjectAsBlob(fileName);
    return new Response(blob);
  } catch (error) {
    console.error('Lỗi khi tải file:', error);

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tải file' },
      { status: 500 }
    );
  }
}
