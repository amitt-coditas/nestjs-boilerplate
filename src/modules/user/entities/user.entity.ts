import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { PasswordResetToken } from 'src/modules/auth/entities/password-reset-token.entity';

import { UserToken } from '../../auth/entities/user-token.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ type: 'text', name: 'f_name' })
  fname: string;

  @Column({ type: 'text', name: 'l_name' })
  lname: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', name: 'phone', unique: true })
  phone: string;

  @Column({ type: 'text', name: 'email', unique: true })
  email: string;

  @Column({ type: 'text', name: 'password', nullable: true })
  password: string;

  @Column({ type: 'jsonb', name: 'sso_id', nullable: true })
  ssoId: { google: string; apple: string; facebook: string };

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => UserToken, (token) => token.user, { cascade: true })
  tokens: UserToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user, { cascade: true })
  passwordResetTokens: PasswordResetToken[];
}
