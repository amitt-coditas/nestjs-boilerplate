import { JwtPayload } from 'jsonwebtoken';

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
  email: string;
  avatarUrl?: string;
}
