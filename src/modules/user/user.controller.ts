import { Controller, Post, Body, Headers, Get } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

import { OverrideInvitation, PermitRole, Public } from '@utils/decorators';

import { AddVerifiedMailRequestDto } from './dto/add-verified-mail-request.dto';
import { CreateInvitationTokenRequestDto } from './dto/create-invitation-token-request.dto';
import { CreateInvitationTokenResponseDto } from './dto/create-invitation-token-response.dto';
import { SendEmailSupportRequestDto } from './dto/send-email-support-request.dto';
import { UserMetadataDto } from './dto/user-metadata.dto';
import { VerifiedMailResponseDto } from './dto/verified-mail-response.dto';
import { InvitationService } from './services/invitation.service';
import { UserMetadataService } from './services/user-metadata.service';
import { UserSessionService } from './services/user-session.service';
import { UserSupportMailService } from './services/user-support-mail.service';
import { VerifiedMailService } from './services/verified-mail.service';

import { ROLES } from '../role/constants/roles.enum';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userMetadataService: UserMetadataService,
    private readonly userSessionService: UserSessionService,
    private readonly userSupportMailService: UserSupportMailService,
    private readonly invitationService: InvitationService,
    private readonly verifiedMailService: VerifiedMailService,
  ) {}

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiBody({ type: UserMetadataDto })
  subscribe(@Body() userMetadataDto: UserMetadataDto): Promise<{
    newsletter: boolean;
  }> {
    return this.userMetadataService.subscribe(userMetadataDto);
  }

  @Public()
  @Get('session-id')
  @ApiOperation({ summary: 'Get session ID' })
  @ApiHeader({ name: 'X-Session-Id', description: 'Session ID' })
  generateSessionId(
    @Headers('X-Session-Id') sessionId: string | undefined,
  ): Promise<{ sessionId: string; validTill: Date }> {
    return this.userSessionService.generateSessionId(sessionId);
  }

  @Public()
  @OverrideInvitation()
  @Post('email-support')
  @ApiOperation({ summary: 'Send a support email' })
  @ApiBody({ type: SendEmailSupportRequestDto })
  sendSupportEmail(
    @Body() input: SendEmailSupportRequestDto,
  ): Promise<{ status: boolean; message: string }> {
    return this.userSupportMailService.sendSupportEmail(input);
  }

  @Public()
  @OverrideInvitation()
  @Post('invitation-token')
  @ApiOperation({ summary: 'Send a guest token' })
  @ApiBody({ type: CreateInvitationTokenRequestDto })
  sendInvitationToken(
    @Body() input: CreateInvitationTokenRequestDto,
  ): Promise<CreateInvitationTokenResponseDto> {
    return this.invitationService.sendInvitationToken(input.email);
  }

  @PermitRole(ROLES.ADMIN)
  @OverrideInvitation()
  @Post('add-verified-mail')
  @ApiOperation({ summary: 'Add a verified mail' })
  @ApiBody({ type: AddVerifiedMailRequestDto })
  @ApiBearerAuth()
  @ApiSecurity('Bearer')
  addVerifiedMail(
    @Body() input: AddVerifiedMailRequestDto,
  ): Promise<VerifiedMailResponseDto> {
    return this.verifiedMailService.addVerifiedMail(input.email);
  }

  @PermitRole(ROLES.ADMIN)
  @OverrideInvitation()
  @Post('unverify-mail')
  @ApiOperation({ summary: 'Un-verify a mail' })
  @ApiBody({ type: AddVerifiedMailRequestDto })
  @ApiBearerAuth()
  @ApiSecurity('Bearer')
  removeVerifiedMail(
    @Body() input: AddVerifiedMailRequestDto,
  ): Promise<VerifiedMailResponseDto> {
    return this.verifiedMailService.unverifyMail(input.email);
  }
}
