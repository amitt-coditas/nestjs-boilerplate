import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { AbstractEntity } from '@utils/index';

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

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];
}
