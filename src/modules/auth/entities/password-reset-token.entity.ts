import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { User } from '../../user/entities/user.entity';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken extends AbstractEntity {
  @Column({ type: 'text', name: 'token' })
  token: string;

  @Column({ type: 'timestamptz', name: 'valid_till' })
  validTill: Date;

  @Column({ type: 'boolean', name: 'is_used', default: false })
  isUsed: boolean;

  @ManyToOne(() => User, (user) => user.passwordResetTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
