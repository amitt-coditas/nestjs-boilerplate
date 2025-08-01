import { Global, Module } from '@nestjs/common';

import { TwilioService } from './twilio.service';

@Global()
@Module({
  imports: [],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
