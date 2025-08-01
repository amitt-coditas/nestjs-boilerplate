import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '@utils/index';

@Entity('user_metadata')
export class UserMetadata extends AbstractEntity {
  // For future use
  // @Column({ type: 'text', name: 'session_id', unique: true })
  // sessionId!: string;

  @Column({ type: 'text', name: 'email', unique: true })
  email!: string;

  @Column({
    type: 'decimal',
    name: 'latitude',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    name: 'longitude',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude!: number;

  @Column({ type: 'boolean', name: 'newsletter', default: false })
  newsletter!: boolean;
}
