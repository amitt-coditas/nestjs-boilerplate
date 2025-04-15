import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/* eslint-disable import/no-unresolved */
import { App, cert, initializeApp } from 'firebase-admin/app';
import {
  BaseMessage,
  getMessaging,
  Messaging,
  MulticastMessage,
} from 'firebase-admin/messaging';
/* eslint-enable import/no-unresolved */

import { ENV_KEYS } from '../config/config.module';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class FCMService {
  private readonly fileName = FCMService.name;
  private readonly fcmAdmin: App;
  private readonly getMessaging: Messaging;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const fcmKeys = JSON.parse(
      this.configService.getOrThrow<string>(ENV_KEYS.FCM_KEYS),
    ) as Record<string, string>;

    const fcmPrivateKey = fcmKeys.private_key;
    const fcmClientMail = fcmKeys.client_email;
    const fcmProjectId = fcmKeys.project_id;

    this.fcmAdmin = initializeApp({
      credential: cert({
        clientEmail: fcmClientMail,
        privateKey: fcmPrivateKey,
        projectId: fcmProjectId,
      }),
    });
    this.getMessaging = getMessaging(this.fcmAdmin);
  }

  async sendNotificationToMultipleDevices(
    baseMessage: BaseMessage,
    fcmTokens: string[],
    data?: Record<string, string>,
  ) {
    this.logger.debug(
      this.fileName,
      this.sendNotificationToMultipleDevices.name,
      'Initiating sendNotificationToMultipleDevices operation',
      { baseMessage, fcmTokens, data },
    );

    try {
      data = data || { data: 'invalid' };

      const message: MulticastMessage = {
        ...baseMessage,
        tokens: fcmTokens,
        data,
      };
      const response = await this.getMessaging.sendEachForMulticast(message);
      return response;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.sendNotificationToMultipleDevices.name,
        'Failed to send notification to multiple devices',
        error,
      );
      throw new InternalServerErrorException();
    }
  }
}
