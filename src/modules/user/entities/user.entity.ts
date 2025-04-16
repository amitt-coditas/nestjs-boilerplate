import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../utils';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ type: 'text' })
  fname: string;

  @Column({ type: 'text' })
  lname: string;

  @Column({ type: 'text' })
  email: string;
}
