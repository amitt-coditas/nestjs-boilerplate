import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';

import { OS_TYPES } from '@utils/index';

import { Public } from './decorators/is-public.decorator';
import { LoginBodyDto } from './dto/login-body.dto';
import { LoginDto } from './dto/login.dto';
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
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginBodyDto })
  async login(
    @Body() loginDto: LoginBodyDto,
    @Headers('device-id') deviceId: string,
    @Headers('location') location: string,
    @Headers('os') os: OS_TYPES,
    @Headers('fcm-token') fcmToken: string,
  ) {
    const loginData: LoginDto = {
      ...loginDto,
      deviceId,
      location,
      os,
      fcmToken,
    };
    return this.authService.login(loginData);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
