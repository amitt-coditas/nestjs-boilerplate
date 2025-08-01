import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  ICreateResponse,
  IRemoveResponse,
  IPaginatedListAPIResponse,
  IUpdateResponse,
  IListAPIResponse,
  IPaginationOptions,
} from '@utils/index';

import { AbstractEntity } from './abstract.entity';
import { AbstractRepository } from './abstract.repository';

import { NotFoundException, ConflictException } from '../exceptions';
import { LoggerService } from '../logger/logger.service';

export abstract class AbstractService<
  TEntity extends AbstractEntity,
  TRepository extends AbstractRepository<TEntity>,
> {
  readonly logger: LoggerService;

  readonly tableName = this.repository.metadata.tableName;

  constructor(protected readonly repository: TRepository) {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Find many records with pagination
   * @param findQuery - Find query options
   * @param options - Pagination options
   * @returns IPaginatedListAPIResponse<TEntity> - Paginated response with records
   */
  async findManyWithPagination(
    findQuery: FindManyOptions<TEntity>,
    options?: IPaginationOptions,
  ): Promise<IPaginatedListAPIResponse<TEntity>> {
    this.logger.debug(
      this.findManyWithPagination.name,
      'Finding records with query:',
      findQuery,
    );

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const paginatedQuery: FindManyOptions<TEntity> = {
      ...findQuery,
      skip,
      take: limit,
    };

    const totalUnPaginatedCount = await this.repository.count(findQuery);
    const { records, totalCount: totalPaginatedCount } =
      await this.repository.findManyRecords(paginatedQuery);

    return {
      records,
      totalCount: totalPaginatedCount,
      page,
      limit,
      totalPages: Math.ceil(totalUnPaginatedCount / limit),
    };
  }

  /**
   * Find many records
   * @param findQuery - Find query
   * @returns IListAPIResponse<TEntity> - The array of records
   */
  async findMany(
    findQuery: FindManyOptions<TEntity>,
  ): Promise<IListAPIResponse<TEntity>> {
    this.logger.debug(
      this.findMany.name,
      'Finding records with query:',
      findQuery,
    );

    const response = await this.repository.findManyRecords(findQuery);

    return response;
  }

  /**
   * Find one record with options
   * @param findQuery - Find query
   * @returns TEntity | undefined - The record or undefined if not found
   */
  async findOne(
    findQuery: FindOneOptions<TEntity>,
  ): Promise<TEntity | undefined> {
    this.logger.debug(
      this.findOne.name,
      `Finding one record with query:`,
      findQuery,
    );

    const record = await this.repository.findOneRecord(findQuery);

    return record;
  }

  /**
   * Find one record with options
   * @param findQuery - Find query
   * @returns TEntity - The record
   */
  async findOneOrThrow(findQuery: FindOneOptions<TEntity>): Promise<TEntity> {
    this.logger.debug(
      this.findOneOrThrow.name,
      'Finding one record with query:',
      findQuery,
    );

    const record = await this.repository.findOneRecord(findQuery);
    if (!record) throw new NotFoundException(this.tableName);

    return record;
  }

  /**
   * Find one record by id
   * @param id - The id of the record
   * @returns TEntity | undefined - The record or undefined if not found
   */
  async findOneById(id: string): Promise<TEntity | undefined> {
    this.logger.debug(this.findOneById.name, 'Finding one record by id:', id);

    const record = await this.repository.findOneRecord({
      where: {
        id,
      } as FindOptionsWhere<TEntity>,
    });

    return record;
  }

  /**
   * Find one record by id
   * @param id - The id of the record
   * @returns TEntity - The record
   */
  async findOneByIdOrThrow(id: string): Promise<TEntity> {
    this.logger.debug(
      this.findOneByIdOrThrow.name,
      'Finding one record by id:',
      id,
    );

    const record = await this.repository.findOneRecord({
      where: {
        id,
      } as FindOptionsWhere<TEntity>,
    });
    if (!record) throw new NotFoundException(this.tableName);

    return record;
  }

  /**
   * Create a record
   * @param data - The data of the record
   * @returns ICreateResponse - The identifier of the created record
   */
  async create(data: DeepPartial<TEntity>): Promise<ICreateResponse> {
    this.logger.debug(this.create.name, 'Creating record with data:', data);

    const createResponse = await this.repository.createRecord(data);
    if (!createResponse.id)
      throw new ConflictException(`Error creating record in ${this.tableName}`);

    return createResponse;
  }

  /**
   * Update a record
   * @param entity - The entity of the record
   * @param data - The data of the record
   * @returns IUpdateResponse - The result of the update
   */
  async update(
    entity: TEntity,
    data: QueryDeepPartialEntity<TEntity>,
  ): Promise<IUpdateResponse> {
    this.logger.debug(this.update.name, `Updating record ${entity.id}`, data);

    const updateResponse = await this.repository.updateRecord(entity, data);
    if (!updateResponse.status)
      throw new ConflictException(`Error updating record in ${this.tableName}`);

    return updateResponse;
  }

  /**
   * Soft remove a record
   * @param entity - The entity of the record
   * @returns IRemoveResponse - The result of the soft removal
   */
  async softRemove(entity: TEntity): Promise<IRemoveResponse> {
    this.logger.debug(
      this.softRemove.name,
      `Soft removing record ${entity.id}`,
    );
    const removeResponse = await this.repository.softRemoveRecord(entity);
    if (!removeResponse.status)
      throw new ConflictException(
        `Error soft removing record in ${this.tableName}`,
      );

    return removeResponse;
  }

  /**
   * Remove a record
   * @param entity - The entity of the record
   * @returns IRemoveResponse - The result of the removal
   */
  async remove(entity: TEntity): Promise<IRemoveResponse> {
    this.logger.debug(this.remove.name, `Removing record ${entity.id}`);

    const removeResponse = await this.repository.removeRecord(entity);
    if (!removeResponse.status)
      throw new ConflictException(`Error removing record in ${this.tableName}`);

    return removeResponse;
  }
}
