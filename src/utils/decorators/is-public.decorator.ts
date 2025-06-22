import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../constants/decorators.constant';

/**
 * Decorator that marks a route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
