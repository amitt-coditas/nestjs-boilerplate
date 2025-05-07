import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line import/no-unresolved
import { compare, hash } from 'bcrypt';

import {
  BadRequestException,
  InternalServerException,
  UnauthorizedException,
} from '@utils/exceptions';
import { ENV_KEYS, LoggerService } from '@utils/index';

import { UserTokenService } from './user-token.service';

import { ROLES } from '../../role/constants/roles.enum';
import { RoleService } from '../../role/role.service';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { GenerateTokenDto } from '../dto/generate-token.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenPayloadDto } from '../dto/token-payload.dto';
import { UserToken } from '../entities/user-token.entity';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;

  private readonly jwtSecret: string;
  private readonly jwtExpirationInterval: number;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpirationInterval: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
  ) {
    this.logger = LoggerService.forClass(this.constructor.name);

    this.jwtSecret = this.configService.getOrThrow(ENV_KEYS.JWT_SECRET);
    this.jwtExpirationInterval = parseInt(
      this.configService.get(ENV_KEYS.JWT_EXPIRATION_INTERVAL_MS) || '3600000', // 1 hour
    );
    this.jwtRefreshSecret = this.configService.getOrThrow(
      ENV_KEYS.JWT_REFRESH_SECRET,
    );
    this.jwtRefreshExpirationInterval = parseInt(
      this.configService.get(ENV_KEYS.JWT_REFRESH_EXPIRATION_INTERVAL_MS) ||
        '604800000', // 1 week
    );
  }

  async login(input: LoginDto): Promise<UserToken> {
    this.logger.debug(this.login.name, 'Logging in with email', {
      email: input.email,
    });

    try {
      let user: User | undefined;
      if (input.email) {
        user = await this.userService.findOneOrThrowByEmail(input.email);
      } else if (input.phone) {
        user = await this.userService.findOneOrThrowByPhone(input.phone);
      } else {
        throw new BadRequestException('Email or phone is required');
      }

      const existingToken = await this.userTokenService.findOne({
        where: { deviceId: input.deviceId },
      });
      if (existingToken) {
        await this.userTokenService.logout(existingToken.accessToken);
      }

      const userPassword = user.password;
      const inputPassword = input.password;
      const isPasswordValid = await compare(inputPassword, userPassword);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }

      const {
        accessToken,
        accessTokenExpiry,
        refreshToken,
        refreshTokenExpiry,
      } = this.generateTokens(input, user);

      const userTokenId = await this.userTokenService.create({
        location: input.location,
        accessToken,
        accessTokenExpiry,
        refreshToken,
        refreshTokenExpiry,
        os: input.os,
        deviceId: input.deviceId,
        fcmToken: input.fcmToken,
        user,
      });

      return await this.userTokenService.findOneByIdOrThrow(userTokenId);
    } catch (error) {
      this.logger.error(this.login.name, 'Error logging in', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error logging in');
    }
  }

  async register(input: RegisterDto): Promise<string> {
    this.logger.debug(this.register.name, 'Registering with email', {
      email: input.email,
    });

    try {
      const userRole = await this.roleService.findOneOrThrow({
        where: { name: ROLES.USER },
      });
      const password = await hash(input.password, 10);

      const userData = {
        fname: input.fname,
        lname: input.lname,
        phone: input.phone,
        email: input.email,
        password,
        role: userRole,
      };

      const userId = await this.userService.create(userData);

      return userId;
    } catch (error) {
      this.logger.error(this.register.name, 'Error registering', error);
      throw new InternalServerException('Error registering');
    }
  }

  generateTokens(
    input: GenerateTokenDto,
    user: User,
  ): {
    accessToken: string;
    accessTokenExpiry: string;
    refreshToken: string;
    refreshTokenExpiry: string;
  } {
    this.logger.debug(this.generateTokens.name, 'Generating tokens', {
      input,
    });

    try {
      const payload: TokenPayloadDto = {
        email: user.email,
        userId: user.id,
        role: user.role.name,
      };

      const accessTokenExpiry = new Date(
        Date.now() + this.jwtExpirationInterval,
      ).toISOString();
      const refreshTokenExpiry = new Date(
        Date.now() + this.jwtRefreshExpirationInterval,
      ).toISOString();

      const accessToken = this.jwtService.sign(
        {
          ...payload,
          issue: new Date().toISOString(),
          expiry: accessTokenExpiry,
        },
        {
          secret: this.jwtSecret,
          expiresIn: `${this.jwtExpirationInterval}ms`,
        },
      );

      const refreshToken = this.jwtService.sign(
        {
          userId: payload.userId,
          issue: new Date().toISOString(),
          expiry: refreshTokenExpiry,
        },
        {
          secret: this.jwtRefreshSecret,
          expiresIn: `${this.jwtRefreshExpirationInterval}ms`,
        },
      );

      return {
        accessToken,
        accessTokenExpiry,
        refreshToken,
        refreshTokenExpiry,
      };
    } catch (error) {
      this.logger.error(
        this.generateTokens.name,
        'Error generating tokens',
        error,
      );
      throw new InternalServerException('Error generating tokens');
    }
  }

  async generateAccessTokenByRefreshToken(
    refreshToken: string,
    accessToken: string,
  ): Promise<{
    accessToken: string;
    accessTokenExpiry: string;
    refreshToken: string;
    refreshTokenExpiry: string;
  }> {
    this.logger.debug(
      this.generateAccessTokenByRefreshToken.name,
      'Generating access token by refresh token',
    );

    try {
      const existingUserToken = await this.userTokenService.findOneOrThrow({
        where: { accessToken, refreshToken },
        relations: ['user'],
      });
      if (!existingUserToken)
        throw new UnauthorizedException(
          'Invalid access token or refresh token',
        );

      if (new Date() < existingUserToken.accessTokenExpiry)
        throw new UnauthorizedException(
          'Previous access-token is yet to expire',
        );
      if (new Date() > existingUserToken.refreshTokenExpiry) {
        await this.userTokenService.logout(existingUserToken.accessToken);
        throw new ForbiddenException('Refresh token has been expired');
      }

      const generateTokensInput: GenerateTokenDto = {
        location: existingUserToken.location,
        deviceId: existingUserToken.deviceId,
        os: existingUserToken.os,
        fcmToken: existingUserToken.fcmToken,
      };
      const newTokens = this.generateTokens(
        generateTokensInput,
        existingUserToken.user,
      );

      const updateResult = await this.userTokenService.update(
        existingUserToken,
        {
          accessToken: newTokens.accessToken,
          accessTokenExpiry: newTokens.accessTokenExpiry,
        },
      );
      if (!updateResult)
        throw new InternalServerException('Error generating access token');

      return {
        accessToken: newTokens.accessToken,
        accessTokenExpiry: newTokens.accessTokenExpiry,
        refreshToken: newTokens.refreshToken,
        refreshTokenExpiry: newTokens.refreshTokenExpiry,
      };
    } catch (error) {
      this.logger.error(
        this.generateAccessTokenByRefreshToken.name,
        'Error generating access token by refresh token',
        error,
      );
      throw new InternalServerException('Error generating access token');
    }
  }
}
