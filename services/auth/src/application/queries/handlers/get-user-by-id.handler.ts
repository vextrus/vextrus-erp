import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '../get-user-by-id.query';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

export interface RoleDto {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  organizationId: string;
  roleId?: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // GAP-001B Fix: Add permissions and roles for RBAC guards
  permissions: string[];
  roles: RoleDto[];
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const { userId } = query;

    // GAP-001B Fix: Join user_roles and roles to get permissions
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // GAP-001B Fix: Aggregate permissions from all active roles
    const activeUserRoles = (user as any).userRoles?.filter((ur: any) => ur.isActive) || [];

    // Debug logging
    console.log('[GAP-001B DEBUG] User ID:', user.id);
    console.log('[GAP-001B DEBUG] User Roles count:', (user as any).userRoles?.length || 0);
    console.log('[GAP-001B DEBUG] Active User Roles count:', activeUserRoles.length);
    console.log('[GAP-001B DEBUG] First role:', activeUserRoles[0]);

    const permissions: string[] = activeUserRoles
      .flatMap((ur: any) => (ur.role?.permissions || []) as string[])
      .filter((p: string) => p); // Remove null/undefined

    const roles: RoleDto[] = activeUserRoles
      .map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: (ur.role.permissions || []) as string[],
      }));

    console.log('[GAP-001B DEBUG] Permissions count:', permissions.length);
    console.log('[GAP-001B DEBUG] Roles count:', roles.length);

    const result: UserDto = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isActive: user.isActive,
      isLocked: user.isLocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // GAP-001B Fix: Return deduplicated permissions and roles
      permissions: [...new Set(permissions)],
      roles,
    };

    if (user.firstName) result.firstName = user.firstName;
    if (user.lastName) result.lastName = user.lastName;
    if (user.phoneNumber) result.phoneNumber = user.phoneNumber;
    if (user.preferredLanguage) result.preferredLanguage = user.preferredLanguage;
    if (user.roleId) result.roleId = user.roleId;
    if (user.lastLoginAt) result.lastLoginAt = user.lastLoginAt;

    return result;
  }
}