import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

import { InternalServerException } from '@utils/exceptions';
import { LoggerService } from '@utils/index';

import {
  FacebookPayload,
  SSOVerifyCredsResponseDto,
} from '../dto/sso-response.dto';

@Injectable()
export class FacebookService {
  private readonly logger: LoggerService;

  private readonly facebookUrl = 'https://graph.facebook.com/me';
  private readonly facebookFields = 'id,first_name,last_name,email,picture';

  constructor() {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  async verifyCredentials(idToken: string): Promise<SSOVerifyCredsResponseDto> {
    this.logger.debug(
      this.verifyCredentials.name,
      'Verifying Facebook credentials',
      { idToken },
    );

    try {
      const url = this.buildFacebookUrl(idToken);

      const {
        data: {
          id: ssoId,
          email,
          picture: {
            data: { url: avatarUrl },
          },
        },
      } = await axios.get<FacebookPayload>(url);

      if (!ssoId || !email) {
        throw new UnauthorizedException(
          'Conflict in verifying Facebook credentials',
        );
      }

      return {
        ssoId,
        email,
        avatarUrl,
      };
    } catch (error: unknown) {
      this.logger.error(
        this.verifyCredentials.name,
        'Error verifying Facebook credentials',
        { error },
      );
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerException('Error verifying Facebook credentials');
    }
  }

  private readonly buildFacebookUrl = (token: string) =>
    `${this.facebookUrl}?fields=${this.facebookFields}&access_token=${token}`;
}
