import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConflictException } from '@utils/exceptions';
import { ENV_KEYS, LoggerService } from '@utils/index';

@Injectable()
export class S3Service {
  private readonly logger: LoggerService;
  private readonly s3Client: S3Client;
  private readonly awsRegion: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = LoggerService.forClass(this.constructor.name);

    this.awsRegion = this.configService.getOrThrow<string>(ENV_KEYS.AWS_REGION);
    const accessKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_ACCESS_KEY,
    );
    const secretKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SECRET_KEY,
    );

    this.s3Client = new S3Client({
      region: this.awsRegion,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  /**
   * List all buckets
   * @returns The buckets
   */
  async listAllBuckets(): Promise<string[]> {
    this.logger.debug(this.listAllBuckets.name, 'Listing all buckets');

    try {
      const command = new ListBucketsCommand({});

      const response = await this.s3Client.send(command);
      if (response && response.Buckets) {
        const buckets = response.Buckets.map((bucket) => bucket.Name as string);
        return buckets;
      }

      return [];
    } catch (error: unknown) {
      this.logger.throwServiceError(this.listAllBuckets.name, error);
    }
  }

  /**
   * List all files in a bucket
   * @param bucket - The bucket to list the files in
   * @returns The files
   */
  async listAllFiles(bucket: string) {
    this.logger.debug(this.listAllFiles.name, 'Listing all files', {
      bucket,
    });

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
      });

      const response = await this.s3Client.send(command);
      if (
        !response.$metadata.httpStatusCode ||
        response.$metadata.httpStatusCode !== 200
      ) {
        throw new ConflictException('Error uploading file');
      }
      if (!response.Contents) return [];

      const files = response.Contents?.map((file) => {
        const key = file.Key as string;

        return {
          key,
          url: this.getObjectGlobalUrl(bucket, key),
        };
      });

      return files;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.listAllFiles.name,
        error,
        'Error listing all files',
      );
    }
  }

  /**
   * Upload a file
   * @param file - The file to upload
   * @param folder - The folder to upload the file to
   * @param bucket - The bucket to upload the file to
   * @returns The key and bucket
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    bucket: string,
  ): Promise<{ key: string; url: string; bucket: string }> {
    this.logger.debug(this.uploadFile.name, 'Uploading file', {
      file: file.originalname,
      folder,
      bucket,
    });

    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const key = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      const response = await this.s3Client.send(command);
      if (
        !response.$metadata.httpStatusCode ||
        response.$metadata.httpStatusCode !== 200
      ) {
        throw new ConflictException('Error uploading file');
      }
      const url = this.getObjectGlobalUrl(bucket, key);

      return {
        key,
        url,
        bucket,
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.uploadFile.name,
        error,
        'Error uploading file',
      );
    }
  }

  /**
   * Delete a file
   * @param key - The key of the file
   * @param bucket - The bucket of the file
   * @returns The key and bucket
   */
  async deleteFile(
    key: string,
    bucket: string,
  ): Promise<{ key: string; bucket: string }> {
    this.logger.debug(this.deleteFile.name, 'Deleting file', {
      key,
      bucket,
    });

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      if (response.$metadata.httpStatusCode !== 204) {
        throw new ConflictException('Error deleting file');
      }

      return {
        key,
        bucket,
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.deleteFile.name,
        error,
        'Error deleting file',
      );
    }
  }

  /**
   * Get a presigned url
   * @param key - The key of the file
   * @param bucket - The bucket of the file
   * @param expiryInSeconds - The expiry in seconds
   * @returns The presigned url
   */
  async getPresignedUrl(
    key: string,
    bucket: string,
    expiryInSeconds = 60 * 60 * 24 * 1,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiryInSeconds,
      });

      return url;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.getPresignedUrl.name,
        error,
        'Error getting presigned url',
      );
    }
  }

  /**
   * List files in a folder
   * @param bucket - The bucket of the folder
   * @param folder - The folder to list the files in
   * @returns The files
   */
  async listFilesInFolder(bucket: string, folder: string): Promise<string[]> {
    this.logger.debug(this.listFilesInFolder.name, 'Listing files in folder', {
      bucket,
      folder,
    });

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: folder,
      });

      const response = await this.s3Client.send(command);
      if (!response.Contents) {
        return [];
      }

      const fileKeys = response.Contents.map((file) => file.Key as string);
      return fileKeys;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.listFilesInFolder.name,
        error,
        'Error listing files in folder',
      );
    }
  }

  /**
   * Get the file url
   * @param bucket - The bucket of the file
   * @param key - The key of the file
   * @returns The file url
   */
  getObjectGlobalUrl(bucket: string, key: string): string {
    return `https://${bucket}.s3.${this.awsRegion}.amazonaws.com/${key}`;
  }
}
