import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { VerifiedMail } from './verified-mail.entity';

@Entity('invites')
export class Invitation extends AbstractEntity {
  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'timestamptz', name: 'valid_till' })
  validTill: Date;

  @ManyToOne(() => VerifiedMail, (verifiedMail) => verifiedMail.invitations)
  @JoinColumn({ name: 'verified_mail_id' })
  verifiedMail: VerifiedMail;
}
