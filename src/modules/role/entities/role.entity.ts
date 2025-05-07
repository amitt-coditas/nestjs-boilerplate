import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '@utils/index';

import { User } from '../../user/entities/user.entity';
import { ROLES } from '../constants/roles.enum';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ type: 'enum', enum: ROLES })
  name: ROLES;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
