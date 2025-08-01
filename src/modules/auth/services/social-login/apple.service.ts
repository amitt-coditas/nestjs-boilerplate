import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

import { ConflictException } from '@utils/exceptions';
import { LoggerService } from '@utils/index';

import {
  APPLE_BASE_URL,
  JWKS_APPLE_URI,
} from '../../constants/apple-social-login.constant';
import { LOGIN_TYPE } from '../../constants/login-type.enum';
import { SocialLoginResponseDto } from '../../dto';
import {
  SocialLoginService,
  VerifyAppleIdTokenParams,
  VerifyAppleIdTokenResponse,
} from '../../types/social-login.types';

@Injectable()
export class AppleService implements SocialLoginService {
  private readonly logger: LoggerService;

  private readonly loginType = LOGIN_TYPE.APPLE;

  constructor() {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Verifies an Apple ID token and extracts user credentials.
   *
   * Note: Apple only includes name information (given_name, family_name) in ID tokens
   * on the very first sign-in. For returning users, only email and sub are typically available.
   *
   * @param idToken - The Apple ID token received from the client application
   * @returns Promise resolving to user credentials extracted from the verified token
   * @throws ConflictException when token verification fails or token is invalid
   */
  async verifyCredentials(idToken: string): Promise<SocialLoginResponseDto> {
    this.logger.debug(
      this.verifyCredentials.name,
      'Initiating Apple credentials verification operation',
      {
        idToken,
      },
    );

    try {
      const payload = await this.verifyAppleIdToken({
        idToken,
      });

      const fname = payload.given_name || '';
      const lname = payload.family_name || '';
      const email = payload.email || '';

      const result: SocialLoginResponseDto = {
        loginType: this.loginType,
        fname,
        lname,
        email,
        profilePicture: '',
      };

      return result;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.verifyCredentials.name,
        error,
        'Failed to verify Apple credentials',
      );
    }
  }

  private async getAppleJWK(
    kid: string,
  ): Promise<{ publicKey: string; kid: string; alg: string }> {
    const client = jwksClient({
      cache: true,
      jwksUri: `${APPLE_BASE_URL}${JWKS_APPLE_URI}`,
    });

    const key = await new Promise<jwksClient.SigningKey>((resolve, reject) => {
      client.getSigningKey(kid, (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('No signing key found'));
        }
        return resolve(result);
      });
    });

    return {
      publicKey: key.getPublicKey(),
      kid: key.kid,
      alg: key.alg,
    };
  }

  private async verifyAppleIdToken(
    params: VerifyAppleIdTokenParams,
  ): Promise<VerifyAppleIdTokenResponse> {
    const decoded = jwt.decode(params.idToken, { complete: true });
    if (!decoded || !decoded.header) {
      throw new ConflictException('Invalid token format');
    }

    const { kid, alg: jwtAlg } = decoded.header;
    if (!kid) {
      throw new ConflictException('Token header missing kid');
    }

    const { publicKey, alg: jwkAlg } = await this.getAppleJWK(kid);
    if (jwtAlg !== jwkAlg) {
      throw new ConflictException(
        `The alg does not match the jwk configuration - alg: ${jwtAlg} | expected: ${jwkAlg}`,
      );
    }

    const jwtClaims = jwt.verify(params.idToken, publicKey, {
      algorithms: [jwkAlg as jwt.Algorithm],
      nonce: params.nonce,
    }) as VerifyAppleIdTokenResponse;

    if (jwtClaims?.iss !== APPLE_BASE_URL) {
      throw new ConflictException(
        `The iss does not match the Apple URL - iss: ${jwtClaims.iss} | expected: ${APPLE_BASE_URL}`,
      );
    }

    if (params.clientId) {
      const audienceArray = Array.isArray(jwtClaims.aud)
        ? jwtClaims.aud
        : [jwtClaims.aud];
      const clientIdArray = Array.isArray(params.clientId)
        ? params.clientId
        : [params.clientId];

      const isValidAudience = audienceArray.some((aud) =>
        clientIdArray.includes(aud),
      );

      if (!isValidAudience) {
        throw new ConflictException(
          `The aud parameter does not include this client - is: ${JSON.stringify(
            jwtClaims.aud,
          )} | expected: ${JSON.stringify(params.clientId)}`,
        );
      }
    }

    ['email_verified', 'is_private_email'].forEach((field) => {
      if (jwtClaims[field] !== undefined) {
        jwtClaims[field] = Boolean(jwtClaims[field]);
      }
    });

    return jwtClaims;
  }

  private async analyzeToken(idToken: string): Promise<{
    standardClaims: string[];
    additionalClaims: string[];
    hasNameInfo: boolean;
    hasEmail: boolean;
    tokenPayload: VerifyAppleIdTokenResponse;
  }> {
    const payload = await this.verifyAppleIdToken({ idToken });

    const standardClaims = [
      'iss',
      'aud',
      'exp',
      'iat',
      'sub',
      'at_hash',
      'auth_time',
    ];
    const allClaims = Object.keys(payload);
    const additionalClaims = allClaims.filter(
      (claim) => !standardClaims.includes(claim),
    );

    const analysis = {
      standardClaims: allClaims.filter((claim) =>
        standardClaims.includes(claim),
      ),
      additionalClaims,
      hasNameInfo: !!(payload.given_name || payload.family_name),
      hasEmail: !!payload.email,
      tokenPayload: payload,
    };

    return analysis;
  }
}
