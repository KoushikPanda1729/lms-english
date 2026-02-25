import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { Config } from "../config/config"
import { ValidationError } from "../shared/errors"

export class StorageService {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor() {
    const hasCustomEndpoint = !!Config.STORAGE_ENDPOINT

    this.client = new S3Client({
      // Omit endpoint for real AWS S3 (SDK resolves it from region automatically)
      ...(hasCustomEndpoint && { endpoint: Config.STORAGE_ENDPOINT }),
      region: Config.STORAGE_REGION,
      credentials: {
        accessKeyId: Config.STORAGE_ACCESS_KEY,
        secretAccessKey: Config.STORAGE_SECRET_KEY,
      },
      // forcePathStyle is required for MinIO, must be false for AWS S3
      forcePathStyle: hasCustomEndpoint,
    })

    this.bucket = Config.STORAGE_BUCKET_NAME
    this.publicUrl = Config.STORAGE_PUBLIC_URL.replace(/\/$/, "")
  }

  isConfigured(): boolean {
    return !!(Config.STORAGE_ACCESS_KEY && Config.STORAGE_SECRET_KEY && Config.STORAGE_BUCKET_NAME)
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new ValidationError(
        "Storage not configured. Please set STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY and STORAGE_BUCKET_NAME in your .env file.",
      )
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    return `${this.publicUrl}/${key}`
  }

  async delete(key: string): Promise<void> {
    if (!this.isConfigured()) return

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }

  extractKey(url: string): string {
    return url.replace(`${this.publicUrl}/`, "")
  }
}
