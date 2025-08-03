import { Injectable } from '@nestjs/common';

import { BadRequestException, ConflictException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { VerifiedMailResponseDto } from '../dto/verified-mail-response.dto';
import { VerifiedMail } from '../entities/verified-mail.entity';
import { VerifiedMailRepository } from '../repositories/verified-mail.repository';

@Injectable()
export class VerifiedMailService extends AbstractService<
  VerifiedMail,
  VerifiedMailRepository
> {
  constructor(private readonly verifiedMailRepository: VerifiedMailRepository) {
    super(verifiedMailRepository);
  }

  /**
   * Add a verified mail
   * @param email - The email of the user
   * @returns True if the mail is verified, false otherwise
   */
  async addVerifiedMail(email: string): Promise<VerifiedMailResponseDto> {
    this.logger.debug(this.addVerifiedMail.name, 'Adding verified mail', {
      email,
    });

    try {
      const existingVerifiedMail = await this.findOne({
        where: { email },
      });
      if (existingVerifiedMail) {
        throw new ConflictException('Mail already exists');
      }

      const { id } = await this.create({
        email,
        verified: true,
      });

      return { email, verified: !!id };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.addVerifiedMail.name,
        error,
        'Error adding verified mail',
      );
    }
  }

  /**
   * Unverify a mail
   * @param email - The email of the user
   * @returns True if the mail is unverified, false otherwise
   */
  async unverifyMail(email: string): Promise<VerifiedMailResponseDto> {
    this.logger.debug(this.unverifyMail.name, 'Unverifying mail', { email });

    try {
      const verifiedMail = await this.findOne({
        where: { email },
      });
      if (!verifiedMail) {
        throw new BadRequestException('Incorrect mail entered');
      }

      await this.update(verifiedMail, {
        verified: false,
      });

      return { email, verified: false };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.unverifyMail.name,
        error,
        'Error unverifying mail',
      );
    }
  }
}
