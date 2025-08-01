import { Injectable } from '@nestjs/common';

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
   */
  async populateRolesInDB() {
    this.logger.debug(this.populateRolesInDB.name, 'Populating roles in DB');

    try {
      const { records: roleData } = await this.findMany({});
      const existingRoles = new Set(roleData?.map((role) => role.name) || []);

      const rolesToCreate = Object.values(ROLES);

      await Promise.all(
        rolesToCreate
          .filter((role) => !existingRoles.has(role))
          .map((role) => this.create({ name: role })),
      );

      this.logger.info(this.populateRolesInDB.name, 'Roles populated in DB', {
        roles: rolesToCreate,
      });
    } catch (error) {
      this.logger.throwServiceError(
        this.populateRolesInDB.name,
        error,
        'Error populating roles in DB',
      );
    }
  }
}
