import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ENV_KEYS } from '@utils/index';

import { UserService } from '../../user/services/user.service';
import { TokenPayloadDto } from '../dto/token-payload.dto';
import { UserTokenService } from '../services/user-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(ENV_KEYS.JWT_SECRET),
      passReqToCallback: true,
    });
  }

  /**
   * Validates the JWT token and returns the user.
   * @param req - The request object.
   * @param payload - The payload containing the user ID.
   * @returns - The user object.
   * @throws {UnauthorizedException} - If the token is expired or invalid.
   */
  async validate(req: Request, { userId }: TokenPayloadDto) {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req) as string;
    const token =
      await this.userTokenService.getActiveTokenByAccessToken(accessToken);
    if (!token) throw new UnauthorizedException('Token has been expired');

    return await this.userService.findOneByIdOrThrow(userId);
  }
}
