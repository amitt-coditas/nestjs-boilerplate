import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { AbstractEntity, OS_TYPES } from '@utils/index';

import { User } from '../../user/entities/user.entity';
import { SSO_TYPES } from '../constants/sso-type.enum';

@Entity('user_tokens')
export class UserToken extends AbstractEntity {
  @Column({ type: 'text', name: 'access_token' })
  accessToken: string;

  @Column({ type: 'timestamptz', name: 'access_token_expiry' })
  accessTokenExpiry: Date;

  @Column({ type: 'text', name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'timestamptz', name: 'refresh_token_expiry' })
  refreshTokenExpiry: Date;

  @Column({ type: 'enum', enum: SSO_TYPES, name: 'sso_type', nullable: true })
  ssoType: SSO_TYPES;

  // For later use in authentication
  // @Column({
  //   type: 'decimal',
  //   name: 'latitude',
  //   precision: 10,
  //   scale: 8,
  //   nullable: true,
  // })
  // latitude: number;

  // @Column({
  //   type: 'decimal',
  //   name: 'longitude',
  //   precision: 11,
  //   scale: 8,
  //   nullable: true,
  // })
  // longitude: number;

  @Column({ type: 'enum', enum: OS_TYPES, name: 'os' })
  os: OS_TYPES;

  // @Column({ type: 'text', name: 'device_id' })
  // deviceId: string;

  // @Column({ type: 'text', name: 'fcm_token' })
  // fcmToken: string;

  @ManyToOne(() => User, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
