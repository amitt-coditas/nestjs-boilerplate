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

import { ConflictException, InternalServerException } from '@utils/exceptions';
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
      this.logger.error(this.listAllBuckets.name, 'Error listing all buckets', {
        error,
      });
      throw new InternalServerException('Error listing all buckets');
    }
  }

  /**
   * List all files in a bucket
   * @param bucket - The bucket to list the files in
   * @returns The files
   */
  async listAllFiles(bucket: string): Promise<{ key: string; url: string }[]> {
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

      const files = response.Contents?.map((file) => ({
        key: file.Key as string,
        url: this.getS3Url(bucket, file.Key as string),
      }));

      return files;
    } catch (error: unknown) {
      this.logger.error(this.listAllFiles.name, 'Error listing all files', {
        error,
      });
      throw new InternalServerException('Error listing all files');
    }
  }

  /**
   * List files in a folder
   * @param bucket - The bucket of the folder
   * @param folder - The folder to list the files in
   * @returns The files
   */
  async listFilesInFolder(
    bucket: string,
    folder: string,
  ): Promise<{ key: string; url: string }[]> {
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

      const files = response.Contents?.map((file) => ({
        key: file.Key as string,
        url: this.getS3Url(bucket, file.Key as string),
      }));

      return files;
    } catch (error: unknown) {
      this.logger.error(
        this.listFilesInFolder.name,
        'Error listing files in folder',
        { error },
      );
      throw new InternalServerException('Error listing files in folder');
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
      const url = this.getS3Url(bucket, key);

      return {
        key,
        url,
        bucket,
      };
    } catch (error: unknown) {
      this.logger.error(this.uploadFile.name, 'Error uploading file', {
        error,
      });
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error uploading file');
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
      this.logger.error(this.deleteFile.name, 'Error deleting file', {
        error,
      });
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error deleting file');
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
      this.logger.error(
        this.getPresignedUrl.name,
        'Error getting presigned url',
        {
          error,
        },
      );
      throw new InternalServerException('Error getting presigned url');
    }
  }

  private getS3Url(bucket: string, key: string) {
    return `https://${bucket}.s3.${this.awsRegion}.amazonaws.com/${key}`;
  }
}
