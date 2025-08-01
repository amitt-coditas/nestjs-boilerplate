import { Injectable, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { TIMEZONE } from '../constants/app.constant';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CronService {
  private readonly fileName = CronService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Retrieves all cron job names.
   * @returns An array of all cron job names.
   */
  getAllCronJobNames(): string[] {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const jobNames = Array.from(cronJobs.keys());

    return jobNames;
  }

  /**
   * Initializes a cron job.
   * @param jobName - The name of the cron job to initialize.
   * @param cronExpression - The cron expression for the cron job.
   * @param callbackFunction - The function to be called when the cron job is triggered.
   * @param timezone - The timezone for the cron job.
   */
  initCronJob(
    jobName: string,
    cronExpression: string,
    callbackFunction: () => Promise<void>,
    timezone?: TIMEZONE,
  ) {
    this.logger.debug(
      this.fileName,
      this.initCronJob.name,
      `Initializing ${jobName} notifications cron job with cron expression: ${cronExpression}`,
    );

    // Create the base CronJob
    const baseJob = CronJob.from({
      cronTime: cronExpression,
      onTick: async () => callbackFunction(),
      start: true,
      timeZone: timezone,
    });

    // Add the required properties to match @nestjs/schedule's CronJob type
    const job = Object.assign(baseJob, {
      threshold: 250,
      _isActive: true,
      isActive: true,
    });

    this.schedulerRegistry.addCronJob(jobName, job as CronJob<null, null>);
  }

  /**
   * Stops a cron job by its name.
   * @param jobName - The name of the cron job to stop.
   * @throws {NotFoundException} - If the cron job with the given name is not found.
   */
  stopCronJob(jobName: string) {
    const job = this.schedulerRegistry.getCronJob(jobName);
    if (!job)
      throw new NotFoundException(`Cron job with name "${jobName}" not found.`);

    job.stop();
    this.schedulerRegistry.deleteCronJob(jobName);

    this.logger.debug(
      this.fileName,
      this.stopCronJob.name,
      `Cron job "${jobName}" stopped and deleted successfully.`,
    );
  }

  /**
   * Stops all cron jobs.
   */
  stopAllCronJobs() {
    const BATCH_SIZE = 50;

    const cronJobs = this.schedulerRegistry.getCronJobs();
    const jobNames = Array.from(cronJobs.keys()).filter((jobName) =>
      jobName.includes('send-scheduled-notification-'),
    );
    let stoppedCount = 0;

    for (let i = 0; i < jobNames.length; i += BATCH_SIZE) {
      const batch = jobNames.slice(i, i + BATCH_SIZE);
      for (const jobName of batch) {
        this.schedulerRegistry.deleteCronJob(jobName);
        stoppedCount++;
      }

      this.logger.debug(
        this.fileName,
        this.stopAllCronJobs.name,
        `Batch processed: ${stoppedCount}/${jobNames.length} cron jobs stopped`,
      );
    }

    this.logger.debug(
      this.fileName,
      this.stopAllCronJobs.name,
      `All ${stoppedCount} cron jobs have been stopped and deleted successfully.`,
    );
  }
}
