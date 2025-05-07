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
  readonly logger: LoggerService;

  constructor(
    private readonly entity: Type<TEntity>,
    private readonly entityManager: EntityManager,
  ) {
    super(entity, entityManager);
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Find one record by find query
   * @param findQuery - find query
   * @returns TEntity | undefined - The record or undefined if not found
   */
  async findOneRecord(
    findQuery: FindOneOptions<TEntity>,
  ): Promise<TEntity | undefined> {
    this.logger.debug(
      this.findOneRecord.name,
      'Finding one record for find query',
      findQuery,
    );

    try {
      const record = await this.findOne(findQuery);
      if (!record) return undefined;

      return record;
    } catch (error) {
      this.logger.error(
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
  ): Promise<TEntity[] | undefined> {
    this.logger.debug(
      this.findManyRecords.name,
      'Finding many records for find query',
      findQuery,
    );

    try {
      return await this.find(findQuery);
    } catch (error) {
      this.logger.error(
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
  async createRecord(
    input: QueryDeepPartialEntity<TEntity>,
  ): Promise<string | undefined> {
    this.logger.debug(this.createRecord.name, 'Creating record', input);

    try {
      const insertResult = await this.insert(input);
      const identifier = insertResult.identifiers[0].id as string;

      return identifier;
    } catch (error) {
      this.logger.error(this.createRecord.name, 'Error creating record', error);
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
  ): Promise<boolean | undefined> {
    this.logger.debug(this.updateRecord.name, 'Updating record', record.id);

    try {
      const updateResult = await this.update(record.id, updateFields);
      if (!updateResult.affected) return false;

      return updateResult.affected > 0;
    } catch (error) {
      this.logger.error(this.updateRecord.name, 'Error updating record', error);
    }
  }

  /**
   * Soft remove a record
   * @param record - Record
   * @returns boolean - The result of the soft removal
   */
  async softRemoveRecord(
    record: DeepPartial<TEntity>,
  ): Promise<boolean | undefined> {
    this.logger.debug(
      this.softRemoveRecord.name,
      'Soft removing record',
      record.id,
    );

    try {
      Object.assign(record, { deletedAt: new Date() });
      await this.save(record);

      const softRemoveResult = await this.softRemove(record);

      return softRemoveResult.id === record.id;
    } catch (error) {
      this.logger.error(
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
  async removeRecord(record: TEntity): Promise<boolean | undefined> {
    this.logger.debug(this.removeRecord.name, 'Removing record', record.id);

    try {
      const removeResult = await this.remove(record);

      return removeResult.id === record.id;
    } catch (error) {
      this.logger.error(this.removeRecord.name, 'Error removing record', error);
    }
  }
}
