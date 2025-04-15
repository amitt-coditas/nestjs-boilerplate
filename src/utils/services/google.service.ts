import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { ENV_KEYS } from '../config/config.module';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class GoogleService {
  private readonly fileName = GoogleService.name;
  private readonly googleAuthClientIds: string[];
  private readonly googleAuthClient: OAuth2Client;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.googleAuthClientIds = [
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID),
    ].filter(Boolean) as string[];

    const googleAuthClientSecret = this.configService.getOrThrow<string>(
      ENV_KEYS.GOOGLE_CLIENT_SECRET,
    );

    this.googleAuthClient = new OAuth2Client({
      clientId: this.googleAuthClientIds[0],
      clientSecret: googleAuthClientSecret,
    });
  }

  /**
   * Verify Google credentials
   * @param idToken - The Google ID token to verify
   * @returns The verified profile information
   */
  async verifyGoogleCredentials(idToken: string) {
    this.logger.debug(
      this.fileName,
      this.verifyGoogleCredentials.name,
      'Initiating verifyGoogleCredentials operation',
      { idToken },
    );

    try {
      const tokenInfo = await this.googleAuthClient.verifyIdToken({
        idToken,
        audience: this.googleAuthClientIds,
      });

      const profile = tokenInfo.getPayload();
      return profile;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.verifyGoogleCredentials.name,
        'Failed to verify Google credentials',
        error,
      );
      throw new InternalServerErrorException();
    }
  }
}
