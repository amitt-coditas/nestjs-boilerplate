import { TIMEZONE } from '../constants/app.constants';

export interface TimezoneTime {
  timeZone: TIMEZONE;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  date?: Date;
}
