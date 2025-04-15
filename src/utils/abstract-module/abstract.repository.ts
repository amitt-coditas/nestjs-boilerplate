import { Injectable, Type } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { AbstractEntity } from './abstract.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export abstract class AbstractRepository<
  TEntity extends AbstractEntity,
> extends Repository<TEntity> {
  readonly fileName = this.constructor.name;
  readonly logger: LoggerService;

  constructor(
    private readonly entity: Type<TEntity>,
    private readonly entityManager: EntityManager,
  ) {
    super(entity, entityManager);
    this.logger = new LoggerService();
  }

  /**
   * Find one record by find query
   * @param findQuery - find query
   * @returns TEntity | undefined - The record or undefined if not found
   */
  async findOneRecord(
    findQuery: FindOneOptions<TEntity>,
  ): Promise<TEntity | undefined> {
    try {
      this.logger.debug(
        this.fileName,
        this.findOneRecord.name,
        'Finding one record for find query',
        findQuery,
      );

      const record = await this.findOne(findQuery);
      if (!record) return undefined;

      return record;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.findOneRecord.name,
        'Error finding one record',
        error,
      );
    }
  }

  /**
   * Find many records by find query
   * @param findQuery - find query
   * @returns TEntity[] - The array of records
   */
  async findManyRecords(
    findQuery: FindManyOptions<TEntity>,
  ): Promise<TEntity[]> {
    try {
      this.logger.debug(
        this.fileName,
        this.findManyRecords.name,
        'Finding many records for find query',
        findQuery,
      );

      const records = await this.find(findQuery);
      if (!records) return [];

      return records;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.findManyRecords.name,
        'Error finding many records',
        error,
      );
    }
  }

  /**
   * Create a record
   * @param input - Record
   * @returns string - The identifier of the created record
   */
  async createRecord(input: QueryDeepPartialEntity<TEntity>): Promise<string> {
    try {
      this.logger.debug(
        this.fileName,
        this.createRecord.name,
        'Creating record',
        input,
      );

      const insertResult = await this.insert(input);
      const identifier = insertResult.identifiers[0].id as string;

      return identifier;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.createRecord.name,
        'Error creating record',
        error,
      );
    }
  }

  /**
   * Update a record
   * @param record - Record
   * @param updateFields - Update fields
   * @returns boolean - The result of the update
   */
  async updateRecord(
    record: TEntity,
    updateFields: QueryDeepPartialEntity<TEntity>,
  ): Promise<boolean> {
    try {
      this.logger.debug(
        this.fileName,
        this.updateRecord.name,
        'Updating record',
        record.id,
      );

      const updateResult = await this.update(record.id, updateFields);

      return updateResult.affected > 0;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.updateRecord.name,
        'Error updating record',
        error,
      );
    }
  }

  /**
   * Soft remove a record
   * @param record - Record
   * @returns boolean - The result of the soft removal
   */
  async softRemoveRecord(record: DeepPartial<TEntity>): Promise<boolean> {
    try {
      this.logger.debug(
        this.fileName,
        this.softRemoveRecord.name,
        'Soft removing record',
        record.id,
      );

      Object.assign(record, { deletedAt: new Date() });
      await this.save(record);

      const softRemoveResult = await this.softRemove(record);

      return softRemoveResult.id === record.id;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.softRemoveRecord.name,
        'Error soft removing record',
        error,
      );
    }
  }

  /**
   * Remove a record
   * @param record - Record
   * @returns boolean - The result of the removal
   */
  async removeRecord(record: TEntity): Promise<boolean> {
    try {
      this.logger.debug(
        this.fileName,
        this.removeRecord.name,
        'Removing record',
        record.id,
      );

      const removeResult = await this.remove(record);

      return removeResult.id === record.id;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.removeRecord.name,
        'Error removing record',
        error,
      );
    }
  }
}
