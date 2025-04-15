import { Module } from '@nestjs/common';

import { S3Service } from './aws-s3.service';
import { SQSService } from './aws-sqs.service';

@Module({
  imports: [],
  providers: [S3Service, SQSService],
  exports: [S3Service, SQSService],
})
export class AWSModule {}
