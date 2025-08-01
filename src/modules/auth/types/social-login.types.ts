import { SocialLoginResponseDto } from '../dto/social-login-response.dto';

export interface SocialLoginService {
  verifyCredentials(idToken: string): Promise<SocialLoginResponseDto>;
}

export interface VerifyAppleIdTokenParams {
  idToken: string;
  clientId?: string | string[];
  nonce?: string;
}

export interface VerifyAppleIdTokenResponse {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  sub: string;
  nonce?: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
}
