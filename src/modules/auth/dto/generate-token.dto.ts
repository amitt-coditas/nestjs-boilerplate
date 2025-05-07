import { OmitType } from '@nestjs/swagger';

import { LoginDto } from './login.dto';

export class GenerateTokenDto extends OmitType(LoginDto, ['password']) {}
