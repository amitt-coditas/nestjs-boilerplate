import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';

import { Public } from '@utils/decorators';

import { LoginBodyDto, SSOLoginBodyDto } from './dto/login-body.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { UserTokenService } from './services/user-token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userTokenService: UserTokenService,
  ) {}

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Google Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleGoogleLogin(@Body() input: SSOLoginBodyDto) {
    return this.authService.handleGoogleLogin(input);
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: 'Apple Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleAppleLogin(@Body() input: SSOLoginBodyDto) {
    return this.authService.handleAppleLogin(input);
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Facebook Login' })
  @ApiBody({ type: SSOLoginBodyDto })
  async handleFacebookLogin(@Body() input: SSOLoginBodyDto) {
    return this.authService.handleFacebookLogin(input);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginBodyDto })
  async handleCredentialsLogin(@Body() input: LoginBodyDto) {
    return this.authService.handleCredentialsLogin(input);
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
  @ApiBody({
    type: Object,
    schema: { properties: { refreshToken: { type: 'string' } } },
  })
  @ApiHeader({ name: 'authorization', description: 'Refresh Token' })
  async accessToken(
    @Body() { refreshToken }: { refreshToken: string },
    @Headers('authorization') authorization: string,
  ) {
    const accessToken = authorization.split(' ')[1];
    return this.authService.generateAccessTokenByRefreshToken(
      refreshToken,
      accessToken,
    );
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiHeader({ name: 'authorization', description: 'Access Token' })
  async logout(@Headers('authorization') authorization: string) {
    const accessToken = authorization.split(' ')[1];
    return this.userTokenService.logout(accessToken);
  }
}
