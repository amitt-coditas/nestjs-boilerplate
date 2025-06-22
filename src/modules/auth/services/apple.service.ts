import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';

import { InternalServerException } from '@utils/exceptions';
import { LoggerService } from '@utils/index';

import {
  AppleJWTPayload,
  SSOVerifyCredsResponseDto,
} from '../dto/sso-response.dto';

@Injectable()
export class AppleService {
  private readonly logger: LoggerService;

  private readonly appleKeysUrl = 'https://appleid.apple.com/auth/keys';

  constructor() {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Verifies the provided Apple ID token and retrieves the associated user's profile information.
   * @param idToken - The Apple ID token to verify.
   * @returns The verified profile information as a SSOVerifyCredsResponseDto.
   * @throws UnauthorizedException if the ID token is invalid.
   * @throws InternalServerException if an error occurs during token verification.
   */
  async verifyCredentials(idToken: string): Promise<SSOVerifyCredsResponseDto> {
    this.logger.debug(
      this.verifyCredentials.name,
      'Initiating verifyCredentials operation',
      { idToken },
    );

    try {
      const decodedHeader = jwt.decode(idToken, { complete: true });

      if (!decodedHeader || !decodedHeader.header)
        throw new UnauthorizedException(
          'Conflict in verifying Apple credentials',
        );

      const jwksClient = JwksRsa({
        jwksUri: this.appleKeysUrl,
      });
      const { kid } = decodedHeader.header;
      const key = await jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      const payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      }) as AppleJWTPayload;

      return {
        ssoId: payload.sub,
        email: payload.email,
      };
    } catch (error: unknown) {
      this.logger.error(
        this.verifyCredentials.name,
        'Failed to verify credentials',
        { error },
      );
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerException();
    }
  }
}
