import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { InternalServerException } from '../exceptions';
import { LoggerService } from '../logger/logger.service';
import { ErrorResponse, ValidationFieldError } from '../types/app.types';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger: LoggerService;

  constructor() {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errors: ValidationFieldError[] = [];

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      status = exception.getStatus();

      if (typeof response === 'object' && response !== null) {
        const resObj = response as Record<string, unknown>;

        if (
          resObj.message === 'Validation failed' &&
          Array.isArray(resObj.errors)
        ) {
          message = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
          errors = resObj.errors.map((error: ValidationFieldError) => ({
            field: error.field,
            errors: Array.isArray(error.errors)
              ? error.errors
              : [String(error.errors)],
          }));
        } else {
          message = (resObj.message as string) || message;
          errorCode = (resObj.errorCode as string) || errorCode;
          if (resObj.errors) {
            errors = resObj.errors as ValidationFieldError[];
          }
        }
      } else if (typeof response === 'string') {
        message = response;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;

      const internalError = new InternalServerException(message);
      status = internalError.getStatus();
      errorCode = (internalError.getResponse() as Record<string, unknown>)
        .errorCode as string;
    } else {
      message = 'Unknown error occurred';
      if (exception !== null && exception !== undefined) {
        try {
          message = JSON.stringify(exception);
        } catch {
          message = 'Non-serializable error occurred';
        }
      }
    }

    const errorResponse: ErrorResponse = {
      error: {
        statusCode: status,
        message,
        errorCode,
        errors: errors.length > 0 ? errors : undefined,
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    res.status(status).json(errorResponse);
  }
}
