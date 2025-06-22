import { Injectable, Type } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { IAddResponse, IUpdateResponse, IDeleteResponse } from '@utils/index';

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
    const record = await this.findOne(findQuery);
    if (!record) return undefined;

    return record;
  }

  /**
   * Find many records by find query
   * @param findQuery - find query
   * @returns TEntity[] - The array of records
   */
  async findManyRecords(
    findQuery: FindManyOptions<TEntity>,
  ): Promise<TEntity[] | undefined> {
    return await this.find(findQuery);
  }

  /**
   * Create a record
   * @param input - Record
   * @returns IAddResponse - The identifier of the created record
   */
  async createRecord(
    input: QueryDeepPartialEntity<TEntity>,
  ): Promise<IAddResponse> {
    const insertResult = await this.insert(input);
    const id = insertResult.identifiers[0].id as string;

    return { id };
  }

  /**
   * Update a record
   * @param record - Record
   * @param updateFields - Update fields
   * @returns IUpdateResponse - The result of the update
   */
  async updateRecord(
    record: TEntity,
    updateFields: QueryDeepPartialEntity<TEntity>,
  ): Promise<IUpdateResponse> {
    const updateResult = await this.update(record.id, updateFields);
    if (!updateResult.affected) return false;

    return updateResult.affected > 0;
  }

  /**
   * Soft remove a record
   * @param record - Record
   * @returns IDeleteResponse - The result of the soft removal
   */
  async softRemoveRecord(
    record: DeepPartial<TEntity>,
  ): Promise<IDeleteResponse> {
    Object.assign(record, { deletedAt: new Date() });
    await this.save(record);

    const softRemoveResult = await this.softRemove(record);

    return softRemoveResult.id === record.id;
  }

  /**
   * Remove a record
   * @param record - Record
   * @returns IDeleteResponse - The result of the removal
   */
  async removeRecord(record: TEntity): Promise<IDeleteResponse> {
    const removeResult = await this.remove(record);

    return removeResult.id === record.id;
  }
}
