import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { OS_TYPES, AbstractEntity } from '../../../utils';
import { User } from '../../user/entities/user.entity';

@Entity('user_tokens')
export class UserToken extends AbstractEntity {
  @Column({ type: 'text', name: 'location' })
  location!: string;

  @Column({ type: 'text', name: 'access_token' })
  accessToken!: string;

  @Column({ type: 'timestamptz', name: 'access_token_expiry' })
  accessTokenExpiry!: Date;

  @Column({ type: 'text', name: 'refresh_token' })
  refreshToken!: string;

  @Column({ type: 'timestamptz', name: 'refresh_token_expiry' })
  refreshTokenExpiry!: Date;

  @Column({ type: 'enum', enum: OS_TYPES, name: 'os' })
  os!: OS_TYPES;

  @Column({ type: 'text', name: 'device_id' })
  deviceId!: string;

  @Column({ type: 'text', name: 'fcm_token' })
  fcmToken!: string;

  @ManyToOne(() => User, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
