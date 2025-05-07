import { Injectable } from '@nestjs/common';

import { InternalServerException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { ROLES } from './constants/roles.enum';
import { Role } from './entities/role.entity';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService extends AbstractService<Role, RoleRepository> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository);
  }

  /**
   * Populates roles in the database if they don't exist
   * @throws InternalServerErrorException if an error occurs
   */
  async populateRolesInDB() {
    this.logger.debug(this.populateRolesInDB.name, 'Populating roles in DB');

    try {
      const roleData = await this.findMany({});
      const existingRoles = new Set(roleData?.map((role) => role.name) || []);

      const rolesToCreate = Object.values(ROLES);
      await Promise.all(
        rolesToCreate
          .filter((role) => !existingRoles.has(role))
          .map((role) => this.create({ name: role })),
      );
    } catch (error) {
      this.logger.error(
        this.populateRolesInDB.name,
        'Error populating roles in DB',
        error,
      );
      throw new InternalServerException('Error populating roles in DB');
    }
  }
}
