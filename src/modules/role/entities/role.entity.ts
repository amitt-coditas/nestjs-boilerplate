import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../utils';
import { ROLES } from '../constants/roles.enum';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ type: 'enum', enum: ROLES })
  name: ROLES;

  @Column({ type: 'text' })
  description: string;
}
