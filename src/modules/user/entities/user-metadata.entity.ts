import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '@utils/index';

@Entity('user_metadata')
export class UserMetadata extends AbstractEntity {
  @Column({ type: 'text', name: 'email', unique: true })
  email!: string;

  @Column({ type: 'text', name: 'location' })
  location!: string;
}
