import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { User } from '../../user/entities/user.entity';
import { OTP_PURPOSE } from '../constants/otp.enum';

@Entity('user_otps')
export class UserOtps extends AbstractEntity {
  @Column({ type: 'varchar', name: 'otp', length: 6 })
  otp!: string;

  @Column({ type: 'timestamptz', name: 'valid_till' })
  validTill!: Date;

  @Column({ type: 'enum', enum: OTP_PURPOSE, name: 'purpose' })
  purpose!: OTP_PURPOSE;

  @Column({ type: 'boolean', name: 'is_used', default: false })
  isUsed!: boolean;

  @Column({ type: 'text', name: 'message_id' })
  messageId: string;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
