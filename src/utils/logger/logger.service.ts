import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENV_KEYS, NODE_ENV } from '../config/config.module';
import { LogContext } from '../types/app.types';

@Injectable()
export class LoggerService {
  private readonly logger: ConsoleLogger;
  private readonly environment: NODE_ENV;
  className: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = new ConsoleLogger();
    this.environment = this.configService.getOrThrow<NODE_ENV>(
      ENV_KEYS.NODE_ENV,
    );
  }

  private setClassName(className: string): void {
    this.className = className;
  }

  /**
   * Static factory method to create a logger with a class name
   * @param className - The class name
   * @returns A new LoggerService instance
   */
  static forClass(className: string): LoggerService {
    const logger = new LoggerService(new ConfigService());
    logger.setClassName(className);
    return logger;
  }

  /**
   * Generate log context object automatically
   * @param methodName - The method name
   * @param additionalContext - Any additional context to include
   * @returns A structured log context object
   */
  createContext(
    methodName: string,
    additionalContext: Record<string, unknown> = {},
  ): LogContext {
    return {
      className: this.className,
      methodName,
      environment: this.environment,
      ...additionalContext,
    };
  }

  /**
   * Log an informational message
   * @param methodName - The method name
   * @param message - The log message
   * @param parameters - Additional parameters to log
   */
  info(methodName: string, message: string, ...parameters: unknown[]): void {
    const context = this.createContext(methodName);
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.log(formattedMessage, JSON.stringify(context));
  }

  /**
   * Log an error message
   * @param methodName - The method name
   * @param message - The log message
   * @param parameters - Additional parameters to log
   */
  error(methodName: string, message: string, ...parameters: unknown[]): void {
    const context = this.createContext(methodName);
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.error(formattedMessage, undefined, JSON.stringify(context));
  }

  /**
   * Log a warning message
   * @param methodName - The method name
   * @param message - The log message
   * @param parameters - Additional parameters to log
   */
  warn(methodName: string, message: string, ...parameters: unknown[]): void {
    const context = this.createContext(methodName);
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.warn(formattedMessage, JSON.stringify(context));
  }

  /**
   * Log a debug message (only in development environments)
   * @param methodName - The method name
   * @param message - The log message
   * @param parameters - Additional parameters to log
   */
  debug(methodName: string, message: string, ...parameters: unknown[]): void {
    if (this.environment === NODE_ENV.PROD) {
      return;
    }

    const context = this.createContext(methodName);
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.debug(formattedMessage, JSON.stringify(context));
  }

  /**
   * Format the log message with parameters
   * @param message - The log message
   * @param parameters - Parameters to include in the log
   * @returns Formatted log message
   */
  private formatMessage(message: string, parameters: unknown[]): string {
    if (parameters.length === 0) {
      return `>>> ${message}`;
    }

    const formattedParams = parameters
      .map((param) => {
        if (param instanceof Error) {
          return this.formatError(param);
        }

        if (param === undefined) {
          return 'undefined';
        }

        if (param === null) {
          return 'null';
        }

        try {
          if (typeof param === 'object' && param !== null) {
            return JSON.stringify(param, this.circularReplacer());
          }
          if (typeof param === 'string') {
            return param;
          }
          if (typeof param === 'number' || typeof param === 'boolean') {
            return param.toString();
          }
          if (typeof param === 'bigint') {
            return param.toString();
          }
          if (typeof param === 'symbol') {
            return param.toString();
          }
          if (typeof param === 'function') {
            return '[Function]';
          }
          // Default case for any other types
          return '[Unknown Type]';
        } catch {
          return '[Unserializable Object]';
        }
      })
      .join(', ');

    return `>>> ${message} | Parameters: ${formattedParams}`;
  }

  /**
   * Format error objects for logging
   * @param error - The error to format
   * @returns Formatted error string
   */
  private formatError(error: Error): string {
    const errorObj: {
      name: string;
      message: string;
      stack: string | undefined;
      [key: string]: unknown;
    } = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    Object.entries(error).forEach(([key, value]) => {
      if (!['name', 'message', 'stack'].includes(key)) {
        (errorObj as Record<string, unknown>)[key] = value;
      }
    });

    return JSON.stringify(errorObj, this.circularReplacer());
  }

  /**
   * Handle circular references in objects when stringifying
   * @returns A replacer function for JSON.stringify
   */
  private circularReplacer() {
    const seen = new WeakSet();

    return (key: string, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };
  }
}
