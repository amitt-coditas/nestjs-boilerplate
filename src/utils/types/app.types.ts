import { ParsedQs } from 'qs';

import { TIMEZONE } from '../constants/app.constants';

export interface LogContext {
  className: string;
  methodName: string;
  userId?: string;
  [key: string]: unknown;
}

export interface ValidationFieldError {
  field: string;
  errors: string[];
}

export interface ErrorDetails {
  statusCode: number;
  message: string;
  errorCode: string;
  errors?: ValidationFieldError[];
}

export interface ErrorResponse {
  error: ErrorDetails;
  timestamp: string;
  path: string;
}

export interface SuccessResponse<T> {
  data: T;
  path: string;
  statusCode: number;
  timestamp: string;
}

export interface RequestContextInfo {
  method: string;
  url: string;
  query: ParsedQs;
  params: Record<string, string>;
  headers: {
    'user-agent'?: string;
    'x-forwarded-for'?: string;
    [key: string]: string | undefined;
  };
}

export interface TimezoneTime {
  timeZone: TIMEZONE;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  date?: Date;
}
