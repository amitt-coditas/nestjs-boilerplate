import {
  Injectable,
  ValidationPipe as NestValidationPipe,
  ValidationError,
} from '@nestjs/common';

import { ValidationException } from '../exceptions/';
import { ValidationFieldError } from '../types/app.types';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]): ValidationException => {
        const formattedErrors: ValidationFieldError[] = errors.map((err) => {
          const constraints = err.constraints || {};
          const nestedErrors = err.children?.length
            ? this.formatNestedErrors(err.children, err.property)
            : [];

          return {
            field: err.property,
            errors: [
              ...Object.values(constraints),
              ...nestedErrors.flatMap((ne) => ne.errors),
            ],
            value: this.sanitizeValue(err.value),
          };
        });

        return new ValidationException(formattedErrors);
      },
    });
  }

  private formatNestedErrors(
    errors: ValidationError[],
    parentField: string,
  ): ValidationFieldError[] {
    return errors.map((err) => {
      const constraints = err.constraints || {};
      const fieldPath = `${parentField}.${err.property}`;

      const nestedErrors = err.children?.length
        ? this.formatNestedErrors(err.children, fieldPath)
        : [];

      return {
        field: fieldPath,
        errors: [
          ...Object.values(constraints),
          ...nestedErrors.flatMap((ne) => ne.errors),
        ],
        value: this.sanitizeValue(err.value),
      };
    });
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === undefined || value === null) {
      return null;
    }
    return value;
  }
}
