import { JwtPayload } from 'jsonwebtoken';

import { SSO_TYPES } from '../constants/sso-type.enum';

export class AppleJWTPayload implements JwtPayload {
  sub: string;
  email: string;
}

export class FacebookPayload {
  id: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export class SSOVerifyCredsResponseDto {
  ssoId: string;
  ssoType: SSO_TYPES;
  email: string;
  avatarUrl?: string;
}
