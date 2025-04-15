import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';

import { ENV_KEYS, NodeEnv } from '../../config/config.module';
import { InternalServerErrorException } from '../../exceptions/internal-server-error.exception';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class S3Service {
  private readonly fileName = S3Service.name;
  private readonly s3Client: S3;
  private readonly bucket: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const nodeEnv = this.configService.getOrThrow<NodeEnv>(ENV_KEYS.NODE_ENV);
    const awsAccessKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_ACCESS_KEY,
    );
    const awsSecretKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SECRET_KEY,
    );
    const awsRegion = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_REGION,
    );
    this.bucket =
      nodeEnv === 'prod'
        ? this.configService.getOrThrow<string>(ENV_KEYS.AWS_PROD_BUCKET)
        : this.configService.getOrThrow<string>(ENV_KEYS.AWS_DEV_BUCKET);

    this.s3Client = new S3({
      region: awsRegion,
      credentials: { accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey },
    });
  }

  /**
   * Uploads a file to S3
   * @param file - The file to upload
   * @param folder - The folder to upload the file to
   * @param svg - Whether the file is an SVG
   * @returns The URL of the uploaded file
   */
  async uploadFileToS3(file: Express.Multer.File, folder: string, svg = false) {
    this.logger.debug(
      this.fileName,
      this.uploadFileToS3.name,
      'Uploading file to S3',
      { file, folder, svg },
    );

    try {
      const fileExtension = file.originalname.split('.').pop();
      const s3Key = `${folder}/${uuidV4()}.${fileExtension}`;
      const params = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ...(svg && { ContentType: 'image/svg+xml' }),
      };

      await this.s3Client.send(new PutObjectCommand(params));
      return `https://${this.bucket}.s3.amazonaws.com/${s3Key}`;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.uploadFileToS3.name,
        'Error uploading file to S3',
        { error },
      );
      throw new InternalServerErrorException('Error uploading file to S3');
    }
  }

  /**
   * Gets a pre-signed URL for a file in S3
   * @param key - The key of the file
   * @returns The pre-signed URL
   */
  async getPreSignedUrl(key: string) {
    this.logger.debug(
      this.fileName,
      this.getPreSignedUrl.name,
      'Getting pre-signed URL',
      { key },
    );

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command);
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.getPreSignedUrl.name,
        'Error getting pre-signed URL',
        { error },
      );
      throw new InternalServerErrorException('Error getting pre-signed URL');
    }
  }
}
