import { LoginMetadataDto } from './login-metadata.dto';

import { User } from '../../user/entities/user.entity';

export class GenerateTokenDto extends LoginMetadataDto {
  user: User;
}
