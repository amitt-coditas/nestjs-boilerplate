import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { TimeService } from '@utils/index';

import { AuthController } from './auth.controller';
import { UserOtpRepository } from './repositories/user-otp.repository';
import { UserTokenRepository } from './repositories/user-token.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { AppleService } from './services/social-login/apple.service';
import { GoogleService } from './services/social-login/google.service';
import { SocialLoginOrchestrator } from './services/social-login-orchestrator.service';
import { UserOtpService } from './services/user-otp.service';
import { UserTokenService } from './services/user-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [RoleModule, UserModule, PassportModule, JwtModule],
  providers: [
    TimeService,
    UserTokenRepository,
    UserTokenService,
    UserOtpRepository,
    UserOtpService,
    PasswordService,
    AuthService,
    JwtStrategy,
    SocialLoginOrchestrator,
    GoogleService,
    AppleService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
