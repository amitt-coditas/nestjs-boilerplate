import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  IAddResponse,
  IDeleteResponse,
  IPaginatedListAPIResponse,
  IUpdateResponse,
  BaseFiltersDto,
} from '@utils/index';

import { AbstractEntity } from './abstract.entity';
import { AbstractRepository } from './abstract.repository';

import {
  NotFoundException,
  InternalServerException,
  ConflictException,
} from '../exceptions';
import { LoggerService } from '../logger/logger.service';

@Injectable()
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
    options?: BaseFiltersDto,
  ): Promise<IPaginatedListAPIResponse<TEntity>> {
    this.logger.debug(
      this.findManyWithPagination.name,
      'Finding records with query:',
      findQuery,
    );

    try {
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 10;
      const skip = (page - 1) * limit;

      const paginatedQuery: FindManyOptions<TEntity> = {
        ...findQuery,
        skip,
        take: limit,
      };

      const totalCount = await this.repository.count(findQuery);
      const records = await this.repository.findManyRecords(paginatedQuery);

      return {
        records: records || [],
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      this.logger.error(
        this.findManyWithPagination.name,
        'Error finding records:',
        error,
      );
      throw new InternalServerException('Error finding records');
    }
  }

  /**
   * Find many records
   * @param findQuery - Find query
   * @returns TEntity[] - The array of records
   */
  async findMany(findQuery: FindManyOptions<TEntity>): Promise<TEntity[]> {
    this.logger.debug(
      this.findMany.name,
      'Finding records with query:',
      findQuery,
    );

    try {
      return await this.repository.find(findQuery);
    } catch (error) {
      this.logger.error(this.findMany.name, 'Error finding records:', error);
      throw new InternalServerException('Error finding records');
    }
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

    try {
      const record = await this.repository.findOneRecord(findQuery);

      return record;
    } catch (error) {
      this.logger.error(this.findOne.name, 'Error finding one record:', error);
      throw new InternalServerException('Error finding one record');
    }
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

    try {
      const result = await this.repository.findOne(findQuery);

      if (!result) throw new NotFoundException(this.tableName);

      return result;
    } catch (error) {
      this.logger.error(
        this.findOneOrThrow.name,
        'Error finding one record:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Find one record by id
   * @param id - The id of the record
   * @returns TEntity | undefined - The record or undefined if not found
   */
  async findOneById(id: string): Promise<TEntity | undefined> {
    this.logger.debug(this.findOneById.name, 'Finding one record by id:', id);

    try {
      return await this.repository.findOneRecord({
        where: {
          id,
        } as FindOptionsWhere<TEntity>,
      });
    } catch (error) {
      this.logger.error(
        this.findOneById.name,
        'Error finding one record by id:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
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

    try {
      const result = await this.repository.findOneRecord({
        where: {
          id,
        } as FindOptionsWhere<TEntity>,
      });

      if (!result) throw new NotFoundException(this.tableName);

      return result;
    } catch (error) {
      this.logger.error(
        this.findOneByIdOrThrow.name,
        'Error finding one record by id:',
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Create a record
   * @param data - The data of the record
   * @returns IAddResponse - The identifier of the created record
   */
  async create(data: QueryDeepPartialEntity<TEntity>): Promise<IAddResponse> {
    this.logger.debug(this.create.name, 'Creating record with data:', data);

    try {
      const id = await this.repository.createRecord(data);
      if (!id) throw new ConflictException('Error creating record');

      return id;
    } catch (error) {
      this.logger.error(this.create.name, 'Error creating record:', error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error creating record');
    }
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

    try {
      const result = await this.repository.updateRecord(entity, data);
      if (!result) throw new ConflictException('Error updating record');

      return result;
    } catch (error) {
      this.logger.error(this.update.name, 'Error updating record:', error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error updating record');
    }
  }

  /**
   * Soft remove a record
   * @param entity - The entity of the record
   * @returns IDeleteResponse - The result of the soft removal
   */
  async softRemove(entity: TEntity): Promise<IDeleteResponse> {
    this.logger.debug(
      this.softRemove.name,
      `Soft removing record ${entity.id}`,
    );

    try {
      const result = await this.repository.softRemoveRecord(entity);
      if (!result) throw new ConflictException('Error soft removing record');

      return result;
    } catch (error) {
      this.logger.error(
        this.softRemove.name,
        'Error soft removing record:',
        error,
      );
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error soft removing record');
    }
  }

  /**
   * Remove a record
   * @param entity - The entity of the record
   * @returns IDeleteResponse - The result of the removal
   */
  async remove(entity: TEntity): Promise<IDeleteResponse> {
    this.logger.debug(this.remove.name, `Removing record ${entity.id}`);

    try {
      const result = await this.repository.removeRecord(entity);
      if (!result) throw new ConflictException('Error removing record');

      return result;
    } catch (error) {
      this.logger.error(this.remove.name, 'Error removing record:', error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerException('Error removing record');
    }
  }
}
