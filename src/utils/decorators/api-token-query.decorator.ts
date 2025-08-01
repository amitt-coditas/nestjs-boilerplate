import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

/**
 * Decorator that adds the required token query parameter to Swagger documentation
 */
export const ApiTokenQuery = () =>
  applyDecorators(
    ApiQuery({
      name: 'token',
      type: String,
      required: true,
      description: 'Guest invitation token',
    }),
  );
