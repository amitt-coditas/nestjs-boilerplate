import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@utils/exceptions';
import { ENV_KEYS, LoggerService } from '@utils/index';

import { PasswordService } from './password.service';
import { UserTokenService } from './user-token.service';

import { ROLES } from '../../role/constants/roles.enum';
import { RoleService } from '../../role/role.service';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { LOGIN_TYPE } from '../constants/login-type.enum';
import {
  RegisterRequestDto,
  GenerateTokenDto,
  TokenPayloadDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterResponseDto,
  GenerateAccessTokenResponseDto,
  RegisterAfterSocialLoginRequestDto,
} from '../dto';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;

  private readonly jwtSecret: string;
  private readonly jwtExpirationInterval: number;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpirationInterval: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
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

  /**
   * Handles the credentials login process
   * @param input - The login request data
   * @returns The login response data
   */
  async handleCredentialsLogin(
    input: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    this.logger.debug(
      this.handleCredentialsLogin.name,
      'Logging in with email and password',
      input,
    );

    try {
      const user = await this.userService.findUserByEmailOrPhone(
        input.emailOrPhone,
      );

      const isPasswordValid = await this.passwordService.comparePassword(
        input.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password. Please try again!');
      }

      const generateTokenInput: GenerateTokenDto = {
        loginType: LOGIN_TYPE.CREDENTIALS,
        latitude: input.latitude,
        longitude: input.longitude,
        deviceId: input.deviceId,
        os: input.os,
        user,
      };

      return this.login(generateTokenInput);
    } catch (error) {
      this.logger.throwServiceError(
        this.handleCredentialsLogin.name,
        error,
        `Error logging in with email ${input.emailOrPhone}`,
      );
    }
  }

  /**
   * Generates tokens for a user
   * @param input - The input data
   * @returns The login response data
   */
  async login(input: GenerateTokenDto): Promise<LoginResponseDto> {
    this.logger.debug(this.login.name, 'Logging in with email', input);

    const existingToken = await this.userTokenService.findOne({
      where: { deviceId: input.deviceId },
    });
    if (existingToken) {
      await this.userTokenService.logout(existingToken.accessToken);
    }

    const { accessToken, accessTokenExpiry, refreshToken, refreshTokenExpiry } =
      this.generateTokens(input);

    await this.userTokenService.create({
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry,
      loginType: input.loginType,
      os: input.os,
      deviceId: input.deviceId,
      latitude: input.latitude,
      longitude: input.longitude,
      user: input.user,
    });

    return {
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry,
    };
  }

  /**
   * Registers a new user
   * @param input - The register request data
   * @returns The response of the register
   */
  async register(input: RegisterRequestDto): Promise<RegisterResponseDto> {
    this.logger.debug(this.register.name, 'Registering with email', {
      emailOrPhone: input.emailOrPhone,
    });

    try {
      const existingUser = await this.userService.findUserByEmailOrPhone(
        input.emailOrPhone,
      );
      if (existingUser) {
        throw new BadRequestException(
          'User already exists with this email or phone',
        );
      }

      const userRole = await this.roleService.findOneOrThrow({
        where: { name: ROLES.USER },
      });
      const password = await this.passwordService.hashPassword(input.password);

      const userData: DeepPartial<User> = {
        fname: input.fname,
        lname: input.lname,
        password,
        role: userRole,
      };

      const isEmailInput = this.userService.validateEmailFormat(
        input.emailOrPhone,
      );
      if (isEmailInput) {
        userData.email = input.emailOrPhone;
      } else {
        userData.phone = input.emailOrPhone;
      }

      const { id: userId } = await this.userService.create(userData);
      const user = await this.userService.findOneByIdOrThrow(userId);

      return {
        userId,
        phone: user.phone || '',
        phoneVerified: user.phoneVerified,
        email: user.email || '',
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.register.name,
        error,
        `Error registering user with credentials ${input.emailOrPhone}`,
      );
    }
  }

  /**
   * Registers a user after social login
   * @param input - The register request data
   * @param user - The user
   * @returns The response of the register
   */
  async registerAfterSocialLogin(
    input: RegisterAfterSocialLoginRequestDto,
    user: User,
  ): Promise<RegisterResponseDto> {
    this.logger.debug(
      this.registerAfterSocialLogin.name,
      'Registering after social login',
      {
        emailOrPhone: input.emailOrPhone,
      },
    );

    try {
      const userDataToUpdate: QueryDeepPartialEntity<User> = {
        fname: input.fname,
        lname: input.lname,
      };

      const isEmailInput = this.userService.validateEmailFormat(
        input.emailOrPhone,
      );
      if (isEmailInput) {
        userDataToUpdate.email = input.emailOrPhone;
      } else {
        userDataToUpdate.phone = input.emailOrPhone;
      }

      await this.userService.update(user, userDataToUpdate);
      const updatedUser = await this.userService.findOneByIdOrThrow(user.id);

      return {
        userId: updatedUser.id,
        phone: updatedUser.phone || '',
        phoneVerified: updatedUser.phoneVerified,
        email: updatedUser.email || '',
        emailVerified: updatedUser.emailVerified,
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.registerAfterSocialLogin.name,
        error,
        `Error registering user with credentials ${input.emailOrPhone}`,
      );
    }
  }

  /**
   * Generates a new access token by refresh token
   * @param refreshToken - The refresh token
   * @param accessToken - The access token
   * @returns The login response data
   */
  async generateAccessTokenByRefreshToken(
    refreshToken: string,
    accessToken: string,
  ): Promise<GenerateAccessTokenResponseDto> {
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
        loginType: existingUserToken.loginType,
        latitude: existingUserToken.latitude,
        longitude: existingUserToken.longitude,
        deviceId: existingUserToken.deviceId,
        os: existingUserToken.os,
        user: existingUserToken.user,
      };
      const newTokens = this.generateTokens(generateTokensInput);

      const updateResult = await this.userTokenService.update(
        existingUserToken,
        {
          accessToken: newTokens.accessToken,
          accessTokenExpiry: newTokens.accessTokenExpiry,
        },
      );
      if (!updateResult)
        throw new ConflictException('Error generating access token');

      return {
        accessToken: newTokens.accessToken,
        accessTokenExpiry: newTokens.accessTokenExpiry,
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.generateAccessTokenByRefreshToken.name,
        error,
        'Error generating access token by refresh token',
      );
    }
  }

  /**
   * Generates tokens for a user
   * @param input - The input data
   * @returns The login response data
   */
  private generateTokens(input: GenerateTokenDto): LoginResponseDto {
    this.logger.debug(this.generateTokens.name, 'Generating tokens', {
      input,
    });

    try {
      const payload: TokenPayloadDto = {
        email: input.user.email,
        userId: input.user.id,
        role: input.user.role.name,
      };

      const accessTokenExpiry = new Date(
        Date.now() + this.jwtExpirationInterval,
      );
      const refreshTokenExpiry = new Date(
        Date.now() + this.jwtRefreshExpirationInterval,
      );

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
      this.logger.throwServiceError(
        this.generateTokens.name,
        error,
        'Error generating tokens',
      );
    }
  }
}
