import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { Invitation } from './invitation.entity';

@Entity('verified_mails')
export class VerifiedMail extends AbstractEntity {
  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @OneToMany(() => Invitation, (invitation) => invitation.verifiedMail)
  invitations: Invitation[];
}
