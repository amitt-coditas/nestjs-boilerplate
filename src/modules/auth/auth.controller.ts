import {
  Body,
  Controller,
  Headers,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';

import { Public } from '@utils/decorators';
import { OS_TYPES } from '@utils/index';

import { GenerateAccessTokenByRefreshTokenDto } from './dto/generate-access-token-by-refresh-token.dto';
import { LoginBodyDto, SSOLoginBodyDto } from './dto/login-body.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordInterceptor } from './interceptors/reset-password.interceptor';
import { AuthService } from './services/auth.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { UserTokenService } from './services/user-token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userTokenService: UserTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) {}

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Google Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleGoogleLogin(
    @Body() input: SSOLoginBodyDto,
    @Headers('os') os: OS_TYPES,
  ) {
    return this.authService.handleGoogleLogin({ ...input, os });
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: 'Apple Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleAppleLogin(
    @Body() input: SSOLoginBodyDto,
    @Headers('os') os: OS_TYPES,
  ) {
    return this.authService.handleAppleLogin({ ...input, os });
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Facebook Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleFacebookLogin(
    @Body() input: SSOLoginBodyDto,
    @Headers('os') os: OS_TYPES,
  ) {
    return this.authService.handleFacebookLogin({ ...input, os });
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginBodyDto })
  async handleCredentialsLogin(
    @Body() input: LoginBodyDto,
    @Headers('os') os: OS_TYPES,
  ) {
    return this.authService.handleCredentialsLogin({ ...input, os });
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post('access-token')
  @ApiOperation({ summary: 'Generate access token by refresh token' })
  @ApiBody({ type: GenerateAccessTokenByRefreshTokenDto })
  @ApiHeader({ name: 'authorization', description: 'Access Token' })
  async generateAccessTokenByRefreshToken(
    @Body() input: GenerateAccessTokenByRefreshTokenDto,
    @Headers('authorization') authorization: string,
  ) {
    const accessToken = authorization.split(' ')[1];
    return this.authService.generateAccessTokenByRefreshToken(
      input.refreshToken,
      accessToken,
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'To send forgot password email' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.passwordResetTokenService.forgotPassword(input);
  }

  @Public()
  @Post('reset-password')
  @UseInterceptors(ResetPasswordInterceptor)
  @ApiOperation({ summary: 'To reset password' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() input: ResetPasswordDto) {
    return this.passwordResetTokenService.resetPassword(input);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiHeader({ name: 'authorization', description: 'Access Token' })
  async logout(@Headers('authorization') authorization: string) {
    const accessToken = authorization.split(' ')[1];
    return this.userTokenService.logout(accessToken);
  }
}
