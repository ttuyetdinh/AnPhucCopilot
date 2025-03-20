import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
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
  const blob = await new Response(objectStream as unknown as BodyInit).blob();
  return blob;
}
