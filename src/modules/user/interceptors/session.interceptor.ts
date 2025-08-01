import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { UnauthorizedException } from '@utils/exceptions';
import { CustomRequest } from '@utils/types/custom-request.type';

import { UserSessionService } from 'src/modules/user/services/user-session.service';

@Injectable()
export class SessionInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly SESSION_EXPIRATION_TIME_HOURS = 2;

  constructor(private readonly userSessionService: UserSessionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const headers = request.headers;

    const sessionId =
      (headers['X-Session-Id'] as string | undefined) ||
      (headers['x-session-id'] as string | undefined);
    if (!sessionId) {
      throw new UnauthorizedException('Session ID is required');
    }

    const session = await this.userSessionService.findOne({
      where: {
        sessionId,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    if (session.validTill && session.validTill < new Date()) {
      await this.userSessionService.remove(session);
      throw new UnauthorizedException('Session expired');
    }

    const differenceInMinutes = this.getDifferenceInMinutes(
      session.validTill,
      new Date(),
    );
    if (differenceInMinutes < 30) {
      const currentTime = new Date();
      const validTillHours =
        currentTime.getHours() + this.SESSION_EXPIRATION_TIME_HOURS;
      const validTill = new Date(currentTime.setHours(validTillHours));

      await this.userSessionService.update(session, {
        validTill,
      });
    }

    return next.handle();
  }

  private getDifferenceInMinutes(date1: Date, date2: Date) {
    const diff = date1.getTime() - date2.getTime();
    return Math.abs(diff) / (1000 * 60);
  }
}
