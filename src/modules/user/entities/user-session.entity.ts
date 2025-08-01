import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '@utils/index';

@Entity('user_session')
export class UserSession extends AbstractEntity {
  @Column({ type: 'text', name: 'session_id', unique: true })
  sessionId!: string;

  @Column({ type: 'timestamptz', name: 'valid_till', nullable: true })
  validTill!: Date;
}
