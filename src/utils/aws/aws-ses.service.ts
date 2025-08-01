// ses.service.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENV_KEYS, LoggerService } from '@utils/index';

@Injectable()
export class SESService {
  private readonly logger: LoggerService;
  private readonly sesClient: SESClient;
  private readonly sourceMail: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = LoggerService.forClass(this.constructor.name);

    const region = this.configService.getOrThrow<string>(ENV_KEYS.AWS_REGION);
    const accessKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_ACCESS_KEY,
    );
    const secretKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SECRET_KEY,
    );
    this.sourceMail = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SES_SOURCE_MAIL,
    );

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  async sendMail(email: string, subject: string, body: string) {
    this.logger.debug(this.sendMail.name, 'Sending mail', {
      email,
      subject,
    });

    try {
      const params = {
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Body: {
            Text: {
              Data: body,
            },
          },
          Subject: {
            Data: subject,
          },
        },
        Source: this.sourceMail,
      };

      const command = new SendEmailCommand(params);
      const { MessageId } = await this.sesClient.send(command);

      return MessageId;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.sendMail.name,
        error,
        'Error sending mail',
      );
    }
  }
}
