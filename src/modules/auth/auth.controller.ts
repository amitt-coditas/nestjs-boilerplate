import { Body, Controller, Headers, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiSecurity,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { Public, OverrideInvitation, CurrentUser } from '@utils/decorators';
import {
  BaseMessageResponseDto,
  IRemoveResponse,
  OS_TYPES,
} from '@utils/index';

import {
  GenerateOtpDto,
  GenerateAccessTokenRequestDto,
  GenerateAccessTokenResponseDto,
  GeneratePasswordDto,
  LoginBodyDto,
  LoginResponseDto,
  RegisterAfterSocialLoginRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResetForgotPasswordDto,
  ResetPasswordDto,
  SocialLoginBodyDto,
  VerifySmsOtpDto,
  VerifyEmailOtpDto,
} from './dto';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { SocialLoginOrchestrator } from './services/social-login-orchestrator.service';
import { UserOtpService } from './services/user-otp.service';
import { UserTokenService } from './services/user-token.service';

import { User } from '../user/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly userOtpService: UserOtpService,
    private readonly userTokenService: UserTokenService,
    private readonly socialLoginOrchestrator: SocialLoginOrchestrator,
  ) {}

  @Public()
  @OverrideInvitation()
  @Post('login/social')
  @ApiOperation({ summary: 'Generic Social Login' })
  @ApiBody({ type: SocialLoginBodyDto })
  handleSocialLogin(
    @Body() input: SocialLoginBodyDto,
    @Headers('os') os: OS_TYPES,
    @Headers('device-id') deviceId: string,
  ): Promise<LoginResponseDto> {
    return this.socialLoginOrchestrator.handleSocialLogin({
      ...input,
      os,
      deviceId,
    });
  }

  @Public()
  @OverrideInvitation()
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginBodyDto })
  handleCredentialsLogin(
    @Body() input: LoginBodyDto,
    @Headers('os') os: OS_TYPES,
    @Headers('device-id') deviceId: string,
  ): Promise<LoginResponseDto> {
    return this.authService.handleCredentialsLogin({
      ...input,
      os,
      deviceId,
    });
  }

  @Public()
  @OverrideInvitation()
  @Post('register')
  @ApiOperation({ summary: 'Register' })
  @ApiBody({ type: RegisterRequestDto })
  register(@Body() input: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.authService.register(input);
  }

  @OverrideInvitation()
  @Post('social/register')
  @ApiOperation({ summary: 'Register' })
  @ApiBody({ type: RegisterRequestDto })
  registerAfterSocialLogin(
    @Body() input: RegisterAfterSocialLoginRequestDto,
    @CurrentUser() user: User,
  ): Promise<RegisterResponseDto> {
    return this.authService.registerAfterSocialLogin(input, user);
  }

  @OverrideInvitation()
  @Post('otp/generate')
  @ApiOperation({ summary: 'Generate OTP' })
  @ApiBody({ type: GenerateOtpDto })
  generateOtp(
    @Body() input: GenerateOtpDto,
    @CurrentUser() user: User,
  ): Promise<BaseMessageResponseDto> {
    return this.userOtpService.generateOtp(input, user);
  }

  @OverrideInvitation()
  @Post('otp/verify/sms')
  @ApiOperation({ summary: 'Verify SMS OTP' })
  @ApiBody({ type: VerifySmsOtpDto })
  verifySmsOtp(
    @Body() input: VerifySmsOtpDto,
    @CurrentUser() user: User,
  ): Promise<BaseMessageResponseDto> {
    return this.userOtpService.verifySmsOtp(input, user);
  }

  @OverrideInvitation()
  @Post('otp/verify/email')
  @ApiOperation({ summary: 'Verify Email OTP' })
  @ApiBody({ type: VerifyEmailOtpDto })
  verifyEmailOtp(
    @Body() input: VerifyEmailOtpDto,
    @CurrentUser() user: User,
  ): Promise<BaseMessageResponseDto> {
    return this.userOtpService.verifyEmailOtp(input, user);
  }

  @OverrideInvitation()
  @Post('password/forgot')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiBody({ type: GenerateOtpDto })
  forgotPassword(
    @Body() input: GenerateOtpDto,
  ): Promise<BaseMessageResponseDto> {
    return this.passwordService.forgotPassword(input);
  }

  @Public()
  @OverrideInvitation()
  @Post('password/forgot/reset')
  @ApiOperation({ summary: 'Reset the forgotten password' })
  @ApiQuery({ name: 'token', type: String })
  @ApiBody({ type: ResetForgotPasswordDto })
  resetForgotPassword(
    @Query('token') token: string,
    @Body() input: ResetForgotPasswordDto,
  ): Promise<BaseMessageResponseDto> {
    return this.passwordService.resetForgotPassword(token, input);
  }

  @OverrideInvitation()
  @Post('password/generate')
  @ApiOperation({
    summary:
      'Generate password for user that has no password because of social login',
  })
  @ApiBody({ type: GeneratePasswordDto })
  @ApiBearerAuth()
  @ApiSecurity('Bearer')
  generatePassword(
    @Body() input: GeneratePasswordDto,
    @CurrentUser() user: User,
  ): Promise<BaseMessageResponseDto> {
    return this.passwordService.generatePassword(input, user);
  }

  @OverrideInvitation()
  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiBearerAuth()
  @ApiSecurity('Bearer')
  resetPassword(
    @Body() input: ResetPasswordDto,
    @CurrentUser() user: User,
  ): Promise<BaseMessageResponseDto> {
    return this.passwordService.resetPassword(input, user);
  }

  @Public()
  @OverrideInvitation()
  @Post('token/generate')
  @ApiOperation({ summary: 'Generate access token by refresh token' })
  @ApiBody({ type: GenerateAccessTokenRequestDto })
  generateAccessTokenByRefreshToken(
    @Body() { refreshToken }: { refreshToken: string },
    @Headers('authorization') authorization: string,
  ): Promise<GenerateAccessTokenResponseDto> {
    const accessToken = authorization.split(' ')[1];
    return this.authService.generateAccessTokenByRefreshToken(
      refreshToken,
      accessToken,
    );
  }

  @Post('logout')
  @OverrideInvitation()
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @ApiSecurity('Bearer')
  logout(
    @Headers('authorization') authorization: string,
  ): Promise<IRemoveResponse> {
    const accessToken = authorization.split(' ')[1];
    return this.userTokenService.logout(accessToken);
  }
}
