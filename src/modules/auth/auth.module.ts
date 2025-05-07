import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { UserTokenRepository } from './repositories/user-token.repository';
import { AuthService } from './services/auth.service';
import { UserTokenService } from './services/user-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [RoleModule, UserModule, PassportModule, JwtModule],
  providers: [UserTokenRepository, UserTokenService, AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
