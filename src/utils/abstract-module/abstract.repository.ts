import { Type } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  ICreateResponse,
  IUpdateResponse,
  IRemoveResponse,
  IListAPIResponse,
} from '@utils/index';

import { AbstractEntity } from './abstract.entity';

import { LoggerService } from '../logger/logger.service';

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
  ): Promise<IListAPIResponse<TEntity>> {
    const [records, totalCount] = await this.findAndCount(findQuery);

    return {
      totalCount,
      records,
    };
  }

  /**
   * Create a record
   * @param input - Record
   * @returns ICreateResponse - The identifier of the created record
   */
  async createRecord(input: DeepPartial<TEntity>): Promise<ICreateResponse> {
    const createResponse = this.create(input);

    const record = await this.save(createResponse);

    return { id: record.id };
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

    const status = updateResult.affected ? updateResult.affected > 0 : false;

    return { status };
  }

  /**
   * Soft remove a record
   * @param record - Record
   * @returns IRemoveResponse - The result of the soft removal
   */
  async softRemoveRecord(
    record: DeepPartial<TEntity>,
  ): Promise<IRemoveResponse> {
    Object.assign(record, { deletedAt: new Date() });
    await this.save(record);

    const softRemoveResult = await this.softRemove(record);

    const status = softRemoveResult.id === record.id;

    return { status };
  }

  /**
   * Remove a record
   * @param record - Record
   * @returns IRemoveResponse - The result of the removal
   */
  async removeRecord(record: TEntity): Promise<IRemoveResponse> {
    const removeResult = await this.remove(record);

    const status = removeResult.id === record.id;

    return { status };
  }
}
