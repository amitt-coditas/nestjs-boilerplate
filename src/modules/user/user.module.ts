import { Module } from '@nestjs/common';

import { TimeService } from '@utils/index';

import { InvitationRepository } from './repositories/invitation.repository';
import { UserMetadataRepository } from './repositories/user-metadata.repository';
import { UserSessionRepository } from './repositories/user-session.repository';
import { UserSupportMailRepository } from './repositories/user-support-mail.repository';
import { UserRepository } from './repositories/user.repository';
import { VerifiedMailRepository } from './repositories/verified-mail.repository';
import { InvitationService } from './services/invitation.service';
import { UserMetadataService } from './services/user-metadata.service';
import { UserSessionService } from './services/user-session.service';
import { UserSupportMailService } from './services/user-support-mail.service';
import { UserService } from './services/user.service';
import { VerifiedMailService } from './services/verified-mail.service';
import { UserController } from './user.controller';

import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  providers: [
    TimeService,
    UserRepository,
    UserService,
    UserMetadataRepository,
    UserMetadataService,
    UserSessionRepository,
    UserSessionService,
    InvitationRepository,
    InvitationService,
    VerifiedMailRepository,
    VerifiedMailService,
    UserSupportMailRepository,
    UserSupportMailService,
  ],
  controllers: [UserController],
  exports: [
    UserService,
    UserMetadataService,
    UserSessionService,
    InvitationService,
    VerifiedMailService,
    UserSupportMailService,
  ],
})
export class UserModule {}
