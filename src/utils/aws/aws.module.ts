import { Global, Module } from '@nestjs/common';

import { S3Service } from './aws-s3.service';
import { SESService } from './aws-ses.service';

@Global()
@Module({
  imports: [],
  providers: [S3Service, SESService],
  exports: [S3Service, SESService],
})
export class AWSModule {}
