import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { UserOtps } from 'src/modules/auth/entities/user-otp.entity';

import { UserToken } from '../../auth/entities/user-token.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ type: 'text', name: 'f_name' })
  fname: string;

  @Column({ type: 'text', name: 'l_name' })
  lname: string;

  @Column({ type: 'text', name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({ type: 'text', name: 'phone', unique: true, nullable: true })
  phone: string;

  @Column({ type: 'boolean', name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ type: 'text', name: 'email', unique: true, nullable: true })
  email: string;

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ type: 'text', name: 'password', nullable: true })
  password: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];

  @OneToMany(() => UserOtps, (otp) => otp.user, { cascade: true })
  otps: UserOtps[];
}
