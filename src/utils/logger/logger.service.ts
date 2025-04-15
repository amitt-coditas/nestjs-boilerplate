import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private readonly logger: ConsoleLogger;

  constructor() {
    this.logger = new ConsoleLogger();
  }

  info(
    fileName: string,
    methodName: string,
    message: string,
    ...parameters: unknown[]
  ): void {
    const context = `${fileName} - ${methodName}`;
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.log(formattedMessage, context);
  }

  error(
    fileName: string,
    methodName: string,
    message: string,
    ...parameters: unknown[]
  ): void {
    const context = `${fileName} - ${methodName}`;
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.error(formattedMessage, undefined, context);
  }

  warn(
    fileName: string,
    methodName: string,
    message: string,
    ...parameters: unknown[]
  ): void {
    const context = `${fileName} - ${methodName}`;
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.warn(formattedMessage, context);
  }

  debug(
    fileName: string,
    methodName: string,
    message: string,
    ...parameters: unknown[]
  ): void {
    const context = `${fileName} - ${methodName}`;
    const formattedMessage = this.formatMessage(message, parameters);
    this.logger.debug(formattedMessage, context);
  }

  private formatMessage(message: string, parameters: unknown[]): string {
    if (parameters.length === 0) {
      return message;
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
        return JSON.stringify(param);
      })
      .join(', ');
    return `${message} | Parameters: ${formattedParams}`;
  }

  private formatError(error: Error): string {
    return `${error.message}\n${error.stack}`;
  }
}
