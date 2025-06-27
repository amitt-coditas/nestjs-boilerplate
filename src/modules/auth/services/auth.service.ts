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

import { AppleService } from './apple.service';
import { FacebookService } from './facebook.service';
import { GoogleService } from './google.service';
import { UserTokenService } from './user-token.service';

import { ROLES } from '../../role/constants/roles.enum';
import { RoleService } from '../../role/role.service';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { GenerateTokenDto } from '../dto/generate-token.dto';
import { LoginBodyDto, SSOLoginBodyDto } from '../dto/login-body.dto';
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
    private readonly googleService: GoogleService,
    private readonly appleService: AppleService,
    private readonly facebookService: FacebookService,
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

  /**
   * Handles Google login
   * @param input - Google login input
   * @returns UserToken
   */
  async handleGoogleLogin(input: SSOLoginBodyDto) {
    this.logger.debug(this.handleGoogleLogin.name, 'Handling Google login');

    try {
      const { ssoType, ssoId, email, avatarUrl } =
        await this.googleService.verifyCredentials(input.idToken);

      const generateTokenInput: GenerateTokenDto = {
        ...input,
        email,
        ssoType,
        ssoId,
      };

      const user = await this.userService.findOneOrThrowByEmail(email);

      return this.login(generateTokenInput, user, avatarUrl);
    } catch (error) {
      this.logger.error(
        this.handleGoogleLogin.name,
        'Error logging in with Google',
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error logging in with Google');
    }
  }

  /**
   * Handles Apple login
   * @param input - Apple login input
   * @returns UserToken
   */
  async handleAppleLogin(input: SSOLoginBodyDto) {
    this.logger.debug(this.handleAppleLogin.name, 'Handling Apple login');

    try {
      const { ssoType, ssoId, email } =
        await this.appleService.verifyCredentials(input.idToken);

      const generateTokenInput: GenerateTokenDto = {
        ...input,
        email,
        ssoType,
        ssoId,
      };

      const user = await this.userService.findOneOrThrowByEmail(email);

      return this.login(generateTokenInput, user);
    } catch (error) {
      this.logger.error(
        this.handleAppleLogin.name,
        'Database error while handling Apple login',
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error logging in with Apple');
    }
  }

  /**
   * Handles Facebook login
   * @param input - Facebook login input
   * @returns UserToken
   */
  async handleFacebookLogin(input: SSOLoginBodyDto) {
    this.logger.debug(this.handleFacebookLogin.name, 'Handling Facebook login');

    try {
      const { ssoType, ssoId, email, avatarUrl } =
        await this.facebookService.verifyCredentials(input.idToken);

      const generateTokenInput: GenerateTokenDto = {
        ...input,
        email,
        ssoType,
        ssoId,
      };

      const user = await this.userService.findOneOrThrowByEmail(email);

      return this.login(generateTokenInput, user, avatarUrl);
    } catch (error) {
      this.logger.error(
        this.handleFacebookLogin.name,
        'Database error while handling Facebook login',
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error logging in with Facebook');
    }
  }

  /**
   * Handles credentials login
   * @param input - Credentials login input
   * @returns UserToken
   */
  async handleCredentialsLogin(input: LoginBodyDto): Promise<UserToken> {
    this.logger.debug(
      this.handleCredentialsLogin.name,
      'Logging in with email and password',
      input,
    );

    try {
      const user = await this.userService.findOneOrThrowByEmail(input.email);

      const isPasswordValid = await compare(input.password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }

      const generateTokenInput: GenerateTokenDto = {
        ...input,
        email: input.email,
      };

      return this.login(generateTokenInput, user);
    } catch (error) {
      this.logger.error(
        this.handleCredentialsLogin.name,
        'Error logging in with email and password',
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error logging in');
    }
  }

  /**
   * Logs in a user
   * @param input - Login input
   * @param user - User
   * @returns UserToken
   */
  async login(
    input: GenerateTokenDto,
    user: User,
    avatarUrl?: string,
  ): Promise<UserToken> {
    this.logger.debug(this.login.name, 'Logging in with email', input);

    // For later use in authentication
    // const existingToken = await this.userTokenService.findOne({
    //   where: { deviceId: input.deviceId },
    // });
    // if (existingToken) {
    //   await this.userTokenService.logout(existingToken.accessToken);
    // }

    if (avatarUrl || input.ssoType) {
      await this.userService.update(user, {
        ...(avatarUrl && { avatarUrl }),
        ...(input.ssoType &&
          !user.ssoId?.[input.ssoType] && {
            ssoId: {
              ...user.ssoId,
              [input.ssoType]: input.ssoId,
            },
          }),
      });
    }

    const { accessToken, accessTokenExpiry, refreshToken, refreshTokenExpiry } =
      this.generateTokens(input, user);

    const { id: userTokenId } = await this.userTokenService.create({
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry,
      ssoType: input.ssoType,
      os: input.os,

      // For later use in authentication
      // latitude: input.latitude,
      // longitude: input.longitude,
      // deviceId: input.deviceId,
      // fcmToken: input.fcmToken,

      user,
    });

    return await this.userTokenService.findOneByIdOrThrow(userTokenId);
  }

  /**
   * Registers a user
   * @param input - Register input
   * @returns User ID
   */
  async register(input: RegisterDto): Promise<{ userId: string }> {
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

      const { id: userId } = await this.userService.create(userData);

      return { userId };
    } catch (error) {
      this.logger.error(this.register.name, 'Error registering', error);
      throw new InternalServerException('Error registering');
    }
  }

  /**
   * Generates access token by refresh token
   * @param refreshToken - Refresh token
   * @param accessToken - Access token
   * @returns UserToken
   */
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
        relations: ['user', 'user.role'],
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
        email: existingUserToken.user.email,
        os: existingUserToken.os,

        // For later use in authentication
        // latitude: existingUserToken.latitude,
        // longitude: existingUserToken.longitude,
        // deviceId: existingUserToken.deviceId,
        // os: existingUserToken.os,
        // fcmToken: existingUserToken.fcmToken,
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

  /**
   * Generates tokens
   * @param input - Generate token input
   * @param user - User
   * @returns UserToken
   */
  private generateTokens(
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
}
