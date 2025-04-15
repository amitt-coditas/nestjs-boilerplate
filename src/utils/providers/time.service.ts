import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { TIMEZONE } from '../constants/app.constants';
import { TimezoneTime } from '../types/app.types';

@Injectable()
export class TimeService {
  convertTimestampToUTC(timestamp: string): Date {
    const data = DateTime.fromISO(timestamp);
    return data.toUTC().toJSDate();
  }

  getCurrentDateByTimezone(timeZone: TIMEZONE): Date {
    return DateTime.now().setZone(timeZone).toJSDate();
  }

  getUTCNow(timeZone: TIMEZONE): Date {
    return DateTime.now().setZone(timeZone).toUTC().toJSDate();
  }

  getTimezoneTimeInUTC(
    input: TimezoneTime = {
      timeZone: TIMEZONE.ASIA_KOLKATA,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
  ): Date {
    const { timeZone, hour, minute, second, millisecond, date } = input;

    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime
      .set({
        hour,
        minute,
        second,
        millisecond,
      })
      .toUTC()
      .toJSDate();
  }

  getDateNDaysAgoInUTC(days: number, timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.setZone(timeZone).minus({ days }).toUTC().toJSDate();
  }

  getStartOfDayInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.startOf('day').toUTC().toJSDate();
  }

  getEndOfDayInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.endOf('day').toUTC().toJSDate();
  }

  getStartOfWeekInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.startOf('week').toUTC().toJSDate();
  }

  getEndOfWeekInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.endOf('week').toUTC().toJSDate();
  }

  getStartOfMonthInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.startOf('month').toUTC().toJSDate();
  }

  getEndOfMonthInUTC(timeZone: TIMEZONE, date?: Date): Date {
    const baseDateTime = date
      ? DateTime.fromJSDate(date).setZone(timeZone)
      : DateTime.now().setZone(timeZone);

    return baseDateTime.endOf('month').toUTC().toJSDate();
  }
}
