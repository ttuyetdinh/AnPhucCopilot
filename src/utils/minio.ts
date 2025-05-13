import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: process.env.NODE_ENV === 'production' ? 'minio' : 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = 'documents';

export async function initBucket() {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME);
  }
}

export async function getObjectAsBlob(fileName: string) {
  const objectStream = await minioClient.getObject(BUCKET_NAME, fileName);
  return new Response(objectStream as unknown as BodyInit).blob();
}
