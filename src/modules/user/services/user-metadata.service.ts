import { Injectable } from '@nestjs/common';

import { ConflictException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { UserMetadataDto } from '../dto/user-metadata.dto';
import { UserMetadata } from '../entities/user-metadata.entity';
import { UserMetadataRepository } from '../repositories/user-metadata.repository';

@Injectable()
export class UserMetadataService extends AbstractService<
  UserMetadata,
  UserMetadataRepository
> {
  constructor(private readonly userMetadataRepository: UserMetadataRepository) {
    super(userMetadataRepository);
  }

  /**
   * Subscribe to newsletter
   * @param input - User metadata
   * @returns User metadata
   */
  async subscribe(input: UserMetadataDto) {
    this.logger.debug(this.subscribe.name, 'Subscribing to newsletter', input);

    try {
      const existingUser = await this.findOne({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new ConflictException(
          'This email id is already subscribed to our newsletter.',
        );
      }

      await this.create({
        ...input,
        newsletter: true,
      });

      return {
        newsletter: true,
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.subscribe.name,
        error,
        'Failed to subscribe to newsletter',
      );
    }
  }
}
