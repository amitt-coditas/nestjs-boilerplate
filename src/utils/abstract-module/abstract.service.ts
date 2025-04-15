import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { AbstractEntity } from './abstract.entity';
import { AbstractRepository } from './abstract.repository';

import { NotFoundException, InternalServerException } from '../exceptions';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export abstract class AbstractService<
  TEntity extends AbstractEntity,
  TRepository extends AbstractRepository<TEntity>,
> {
  private readonly tableName = this.repository.metadata.tableName;

  constructor(
    protected readonly repository: TRepository,
    protected readonly logger: LoggerService,
  ) {}

  /**
   * Finds all records matching the given query.
   * @param findQuery - The query options for finding records.
   * @returns An array of records matching the query.
   * @throws If an error occurs during the operation.
   */
  async findMany(findQuery: FindManyOptions<TEntity>): Promise<TEntity[]> {
    this.logger.debug(
      this.constructor.name,
      this.findMany.name,
      'Finding records with query:',
      findQuery,
    );

    try {
      return await this.repository.findManyRecords(findQuery);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.findMany.name,
        'Error finding records:',
        error,
      );
      throw new InternalServerException('Error finding records');
    }
  }

  /**
   * Finds a single record matching the given query.
   * @param findQuery - The query options for finding a record.
   * @returns The found record or undefined if no record is found.
   * @throws If an error occurs during the operation.
   */
  async findOne(
    findQuery: FindOneOptions<TEntity>,
  ): Promise<TEntity | undefined> {
    this.logger.debug(
      this.constructor.name,
      this.findOne.name,
      `Finding one record with query:`,
      findQuery,
    );

    try {
      return await this.repository.findOneRecord(findQuery);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.findOne.name,
        'Error finding one record:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Finds a single record matching the given query and throws an error if no record is found.
   * @param findQuery - The query options for finding a record.
   * @returns The found record.
   * @throws If no record is found or an error occurs during the operation.
   */
  async findOneOrThrow(findQuery: FindOneOptions<TEntity>): Promise<TEntity> {
    this.logger.debug(
      this.constructor.name,
      this.findOneOrThrow.name,
      'Finding one record with query:',
      findQuery,
    );

    try {
      const result = await this.findOne(findQuery);

      if (!result) throw new NotFoundException(this.tableName);

      return result;
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.findOneOrThrow.name,
        'Error finding one record:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Finds a single record by its ID.
   * @param id - The ID of the record to find.
   * @returns The found record or undefined if no record is found.
   * @throws If an error occurs during the operation.
   */
  async findOneById(id: string): Promise<TEntity | undefined> {
    this.logger.debug(
      this.constructor.name,
      this.findOneById.name,
      'Finding one record by id:',
      id,
    );

    try {
      return await this.repository.findOneRecord({
        where: {
          id,
        } as FindOptionsWhere<TEntity>,
      });
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.findOneById.name,
        'Error finding one record by id:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Finds a single record by its ID and throws an error if no record is found.
   * @param id - The ID of the record to find.
   * @returns The found record.
   * @throws If no record is found or an error occurs during the operation.
   */
  async findOneByIdOrThrow(id: string): Promise<TEntity> {
    this.logger.debug(
      this.constructor.name,
      this.findOneByIdOrThrow.name,
      'Finding one record by id:',
      id,
    );

    try {
      const result = await this.findOneById(id);

      if (!result) throw new NotFoundException(this.tableName);

      return result;
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.findOneByIdOrThrow.name,
        'Error finding one record by id:',
        error,
      );
      throw new InternalServerException('Error finding one record');
    }
  }

  /**
   * Creates a new record.
   * @param data - The data for the new record.
   * @returns The ID of the created record.
   * @throws If an error occurs during the operation.
   */
  async create(data: QueryDeepPartialEntity<TEntity>): Promise<string> {
    this.logger.debug(
      this.constructor.name,
      this.create.name,
      'Creating record with data:',
      data,
    );

    try {
      return await this.repository.createRecord(data);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.create.name,
        'Error creating record:',
        error,
      );
      throw new InternalServerException('Error creating record');
    }
  }

  /**
   * Updates an existing record.
   * @param entity - The record to update.
   * @param data - The data for the update.
   * @returns True if the record was updated successfully.
   * @throws If an error occurs during the operation.
   */
  async update(
    entity: TEntity,
    data: QueryDeepPartialEntity<TEntity>,
  ): Promise<boolean> {
    this.logger.debug(
      this.constructor.name,
      this.update.name,
      `Updating record ${entity.id}`,
      data,
    );

    try {
      return await this.repository.updateRecord(entity, data);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.update.name,
        'Error updating record:',
        error,
      );
      throw new InternalServerException('Error updating record');
    }
  }

  /**
   * Soft removes a record.
   * @param entity - The record to soft remove.
   * @returns True if the record was soft removed successfully.
   * @throws If an error occurs during the operation.
   */
  async softRemove(entity: TEntity): Promise<boolean> {
    this.logger.debug(
      this.constructor.name,
      this.softRemove.name,
      `Soft removing record ${entity.id}`,
    );

    try {
      return await this.repository.softRemoveRecord(entity);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.softRemove.name,
        'Error soft removing record:',
        error,
      );
      throw new InternalServerException('Error soft removing record');
    }
  }

  /**
   * Removes a record.
   * @param entity - The record to remove.
   * @returns True if the record was removed successfully.
   * @throws If an error occurs during the operation.
   */
  async remove(entity: TEntity): Promise<boolean> {
    this.logger.debug(
      this.constructor.name,
      this.remove.name,
      `Removing record ${entity.id}`,
    );

    try {
      return await this.repository.removeRecord(entity);
    } catch (error) {
      this.logger.error(
        this.constructor.name,
        this.remove.name,
        'Error removing record:',
        error,
      );
      throw new InternalServerException('Error removing record');
    }
  }
}
