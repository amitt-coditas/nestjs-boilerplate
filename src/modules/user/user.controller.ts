import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserMetadataDto } from './dto/user-metadata.dto';
import { UserMetadataService } from './services/user-metadata.service';

import { Public } from '../auth/decorators/is-public.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userMetadataService: UserMetadataService) {}

  @Public()
  @Post('user-metadata')
  @ApiOperation({ summary: 'Store user metadata' })
  @ApiBody({ type: UserMetadataDto })
  async storeUserMetadata(@Body() userMetadataDto: UserMetadataDto) {
    return this.userMetadataService.create(userMetadataDto);
  }
}
