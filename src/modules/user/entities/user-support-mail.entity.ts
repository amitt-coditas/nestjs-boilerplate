import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '@utils/index';

@Entity('user_support_mails')
export class UserSupportMail extends AbstractEntity {
  @Column({ type: 'text', nullable: false })
  email: string;
}
