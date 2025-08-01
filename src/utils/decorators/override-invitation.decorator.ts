import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { OVERRIDE_INVITATION_KEY } from '../constants/decorators.constant';

/**
 * Decorator that marks a route to skip invitation token validation
 */
export const OverrideInvitation = () => {
  return applyDecorators(
    SetMetadata(OVERRIDE_INVITATION_KEY, true),
    // Add an optional token parameter for Swagger
    ApiQuery({
      name: 'invite',
      type: String,
      required: false,
      description: 'Guest invitation token not required for this endpoint',
    }),
  );
};
