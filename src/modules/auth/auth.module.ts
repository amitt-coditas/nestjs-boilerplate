import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { UserTokenRepository } from './repositories/user-token.repository';
import { AppleService } from './services/apple.service';
import { AuthService } from './services/auth.service';
import { FacebookService } from './services/facebook.service';
import { GoogleService } from './services/google.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { UserTokenService } from './services/user-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [RoleModule, UserModule, PassportModule, JwtModule],
  providers: [
    UserTokenRepository,
    UserTokenService,
    AuthService,
    JwtStrategy,
    GoogleService,
    AppleService,
    FacebookService,
    PasswordResetTokenRepository,
    PasswordResetTokenService,
  ],
  controllers: [AuthController],
  exports: [AuthService, UserTokenService],
})
export class AuthModule {}
