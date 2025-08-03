import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { AbstractEntity, OS_TYPES } from '@utils/index';

import { User } from '../../user/entities/user.entity';
import { LOGIN_TYPE } from '../constants/login-type.enum';

@Entity('user_tokens')
export class UserToken extends AbstractEntity {
  @Column({ type: 'text', name: 'access_token_hash' })
  accessTokenHash!: string;

  @Column({ type: 'timestamptz', name: 'access_token_expiry' })
  accessTokenExpiry!: Date;

  @Column({ type: 'text', name: 'refresh_token_hash' })
  refreshTokenHash!: string;

  @Column({ type: 'timestamptz', name: 'refresh_token_expiry' })
  refreshTokenExpiry!: Date;

  @Column({ type: 'enum', enum: LOGIN_TYPE, name: 'login_type' })
  loginType!: LOGIN_TYPE;

  @Column({ type: 'enum', enum: OS_TYPES, name: 'os' })
  os!: OS_TYPES;

  @Column({ type: 'text', name: 'device_id' })
  deviceId!: string;

  @Column({
    type: 'decimal',
    name: 'latitude',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    name: 'longitude',
    precision: 12,
    scale: 8,
    nullable: true,
  })
  longitude!: number;

  @ManyToOne(() => User, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
