/* eslint-disable no-duplicate-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  OpenAPIObject,
  PathItemObject,
  ParameterObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
/* eslint-enable no-duplicate-imports */
/* eslint-enable @typescript-eslint/no-unused-vars */

import { INestApplication, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';

import { NODE_ENV } from '@utils/config/config.module';
import { LoggerService, OS_TYPES, ENV_KEYS } from '@utils/index';

import { swaggerConfig, swaggerCustomOptions } from './swagger.config';

@Injectable()
export class SwaggerSetupService {
  private readonly isDev: boolean;

  private readonly logger: LoggerService;

  constructor(private readonly configService: ConfigService) {
    this.isDev =
      this.configService.getOrThrow<string>(ENV_KEYS.NODE_ENV) ===
      (NODE_ENV.DEV || NODE_ENV.DEV_LOCAL);

    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Setup Swagger documentation
   * @param app - NestJS application instance
   */
  public setupSwagger(app: INestApplication): void {
    this.logger.debug(
      this.setupSwagger.name,
      'Setting up Swagger documentation',
    );

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    this.addGlobalParameters(document);

    SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
  }

  private addGlobalParameters(document: OpenAPIObject): void {
    type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

    const paths = document.paths;

    Object.values(paths).forEach((pathItem: PathItemObject) => {
      (['get', 'post', 'put', 'delete', 'patch'] as HttpMethod[]).forEach(
        (method) => {
          const operation = pathItem[method];
          if (operation && typeof operation === 'object') {
            const operationObject = operation;

            const parameters: ParameterObject[] = [
              // Header: Operating system
              {
                name: 'os',
                in: 'header',
                required: true,
                schema: {
                  type: 'string',
                  enum: Object.values(OS_TYPES),
                },
                description: 'Operating system',
              },
            ];

            operationObject.parameters = [
              ...(operationObject.parameters || []),
              ...parameters,
            ];
          }
        },
      );
    });
  }
}
