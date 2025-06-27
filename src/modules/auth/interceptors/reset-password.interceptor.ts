import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { ResetPasswordDto } from '../dto/password-reset.dto';
import { PasswordResetTokenService } from '../services/password-reset-token.service';

@Injectable()
export class ResetPasswordInterceptor
  implements NestInterceptor<unknown, unknown>
{
  constructor(
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    const { token } = request.body as ResetPasswordDto;

    await this.passwordResetTokenService.validatePasswordResetToken(token);

    return next.handle();
  }
}
