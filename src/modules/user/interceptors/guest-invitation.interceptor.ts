import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { NODE_ENV } from '@utils/config/config.module';
import { OS_TYPES } from '@utils/constants/app.constant';
import { OVERRIDE_INVITATION_KEY } from '@utils/constants/decorators.constant';
import { ForbiddenException } from '@utils/exceptions';
import { ENV_KEYS } from '@utils/index';
import { CustomRequest } from '@utils/types/custom-request.type';

import { InvitationService } from 'src/modules/user/services/invitation.service';

@Injectable()
export class GuestInvitationInterceptor
  implements NestInterceptor<unknown, unknown>
{
  private readonly isDev: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly invitationService: InvitationService,
  ) {
    this.isDev =
      this.configService.getOrThrow<string>(ENV_KEYS.NODE_ENV) ===
      (NODE_ENV.DEV || NODE_ENV.DEV_LOCAL);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (this.isDev) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const os = request.headers['os'] as OS_TYPES;

    const skip = this.reflector.getAllAndOverride<boolean>(
      OVERRIDE_INVITATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (os === OS_TYPES.ANDROID || os === OS_TYPES.IOS || skip) {
      return next.handle();
    }

    const query = request.query;
    const token = query['invite'] as string | undefined;

    if (!token) {
      throw new ForbiddenException('Guest invitation token is required');
    }

    const isTokenValid = await this.invitationService.checkValidToken(token);
    if (!isTokenValid) {
      throw new ForbiddenException('Invalid guest invitation token');
    }

    return next.handle();
  }
}
