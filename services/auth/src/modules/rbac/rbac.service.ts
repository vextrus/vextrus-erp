import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, LessThan } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    context?: {
      organizationId?: string;
      projectId?: string;
      resourceId?: string;
    },
  ): Promise<boolean> {
    // Get user's active roles
    const userRoles = await this.getUserRoles(userId, context?.organizationId);
    
    if (!userRoles.length) {
      return false;
    }

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      // Check scope restrictions
      if (userRole.scope) {
        if (context?.projectId && userRole.scope.projects) {
          if (!userRole.scope.projects.includes(context.projectId)) {
            continue;
          }
        }
      }

      // Check direct permissions
      if (userRole.role.permissions.includes(permission)) {
        return true;
      }

      // Check permission entities
      if (userRole.role.permissionEntities) {
        const hasPermission = userRole.role.permissionEntities.some(
          p => p.key === permission && p.isActive,
        );
        if (hasPermission) {
          return true;
        }
      }

      // Check inherited permissions from parent roles
      if (userRole.role.parentRole) {
        const hasInheritedPermission = await this.checkInheritedPermission(
          userRole.role.parentRole,
          permission,
        );
        if (hasInheritedPermission) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(
    userId: string,
    organizationId?: string,
  ): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId, organizationId);
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      // Add direct permissions
      userRole.role.permissions.forEach(p => permissions.add(p));

      // Add permission entities
      if (userRole.role.permissionEntities) {
        userRole.role.permissionEntities
          .filter(p => p.isActive)
          .forEach(p => permissions.add(p.key));
      }

      // Add inherited permissions
      if (userRole.role.parentRole) {
        const inheritedPermissions = await this.getInheritedPermissions(
          userRole.role.parentRole,
        );
        inheritedPermissions.forEach(p => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Get user's active roles
   */
  async getUserRoles(
    userId: string,
    organizationId?: string,
  ): Promise<UserRole[]> {
    const query = this.userRoleRepository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.permissionEntities', 'permissions')
      .leftJoinAndSelect('role.parentRole', 'parentRole')
      .where('userRole.userId = :userId', { userId })
      .andWhere('userRole.isActive = :isActive', { isActive: true })
      .andWhere('role.isActive = :roleActive', { roleActive: true });

    if (organizationId) {
      query.andWhere('userRole.organizationId = :organizationId', {
        organizationId,
      });
    }

    // Exclude expired roles
    query.andWhere(
      '(userRole.expiresAt IS NULL OR userRole.expiresAt > :now)',
      { now: new Date() },
    );

    return query.getMany();
  }

  /**
   * Assign a role to a user
   */
  async assignRole(dto: AssignRoleDto): Promise<UserRole> {
    const { userId, roleId, organizationId, assignedBy, expiresAt, scope, reason } = dto;

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role exists and is active
    const role = await this.roleRepository.findOne({
      where: { id: roleId, isActive: true },
    });
    if (!role) {
      throw new NotFoundException('Role not found or inactive');
    }

    // Check if user already has this role
    const existingRole = await this.userRoleRepository.findOne({
      where: {
        userId,
        roleId,
        organizationId,
        isActive: true,
      },
    });

    if (existingRole) {
      // Update existing role assignment
      existingRole.expiresAt = expiresAt;
      existingRole.scope = scope;
      existingRole.reason = reason;
      return this.userRoleRepository.save(existingRole);
    }

    // Create new role assignment
    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      organizationId,
      assignedBy,
      expiresAt,
      scope,
      reason,
      isActive: true,
    });

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Revoke a role from a user
   */
  async revokeRole(
    userId: string,
    roleId: string,
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: {
        userId,
        roleId,
        isActive: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User role assignment not found');
    }

    userRole.isActive = false;
    userRole.revokedAt = new Date();
    userRole.revokedBy = revokedBy;
    userRole.revocationReason = reason;

    await this.userRoleRepository.save(userRole);
  }

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(dto);

    // Set hierarchy level based on parent
    if (dto.parentRoleId) {
      const parentRole = await this.roleRepository.findOne({
        where: { id: dto.parentRoleId },
      });
      if (parentRole) {
        role.level = parentRole.level + 1;
      }
    }

    return this.roleRepository.save(role);
  }

  /**
   * Update a role
   */
  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }

    Object.assign(role, dto);
    role.version += 1;

    return this.roleRepository.save(role);
  }

  /**
   * Get all roles for an organization
   */
  async getRoles(organizationId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { organizationId, isActive: true },
      relations: ['parentRole', 'permissionEntities'],
      order: { level: 'ASC', priority: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get all available permissions
   */
  async getPermissions(category?: string): Promise<Permission[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    return this.permissionRepository.find({
      where,
      order: { category: 'ASC', resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Check inherited permissions from parent roles
   */
  private async checkInheritedPermission(
    role: Role,
    permission: string,
  ): Promise<boolean> {
    if (role.permissions.includes(permission)) {
      return true;
    }

    if (role.permissionEntities) {
      const hasPermission = role.permissionEntities.some(
        p => p.key === permission && p.isActive,
      );
      if (hasPermission) {
        return true;
      }
    }

    if (role.parentRole) {
      return this.checkInheritedPermission(role.parentRole, permission);
    }

    return false;
  }

  /**
   * Get all inherited permissions from parent roles
   */
  private async getInheritedPermissions(role: Role): Promise<string[]> {
    const permissions = new Set<string>();

    // Add direct permissions
    role.permissions.forEach(p => permissions.add(p));

    // Add permission entities
    if (role.permissionEntities) {
      role.permissionEntities
        .filter(p => p.isActive)
        .forEach(p => permissions.add(p.key));
    }

    // Recursively get parent permissions
    if (role.parentRole) {
      const parentPermissions = await this.getInheritedPermissions(
        role.parentRole,
      );
      parentPermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Initialize default roles for Bangladesh Construction context
   */
  async initializeDefaultRoles(organizationId: string): Promise<void> {
    const defaultRoles = [
      {
        name: 'system-admin',
        nameEn: 'System Administrator',
        nameBn: 'সিস্টেম প্রশাসক',
        description: 'Full system access and control',
        descriptionBn: 'সম্পূর্ণ সিস্টেম অ্যাক্সেস এবং নিয়ন্ত্রণ',
        level: 0,
        priority: 100,
        isSystem: true,
        permissions: ['*'],
      },
      {
        name: 'organization-owner',
        nameEn: 'Organization Owner',
        nameBn: 'সংস্থার মালিক',
        description: 'Complete organization management',
        descriptionBn: 'সম্পূর্ণ সংস্থা ব্যবস্থাপনা',
        level: 1,
        priority: 90,
        permissions: ['organization.*', 'project.*', 'finance.*', 'user.*'],
      },
      {
        name: 'project-director',
        nameEn: 'Project Director',
        nameBn: 'প্রকল্প পরিচালক',
        description: 'Strategic project oversight',
        descriptionBn: 'কৌশলগত প্রকল্প তত্ত্বাবধান',
        level: 2,
        priority: 80,
        permissions: ['project.*', 'finance.read', 'report.*'],
      },
      {
        name: 'project-manager',
        nameEn: 'Project Manager',
        nameBn: 'প্রকল্প ব্যবস্থাপক',
        description: 'Day-to-day project management',
        descriptionBn: 'দৈনন্দিন প্রকল্প ব্যবস্থাপনা',
        level: 3,
        priority: 70,
        permissions: ['project.create', 'project.read', 'project.update', 'resource.*'],
      },
      {
        name: 'site-engineer',
        nameEn: 'Site Engineer',
        nameBn: 'সাইট ইঞ্জিনিয়ার',
        description: 'Technical implementation and supervision',
        descriptionBn: 'প্রযুক্তিগত বাস্তবায়ন এবং তত্ত্বাবধান',
        level: 4,
        priority: 60,
        permissions: ['project.read', 'project.update', 'document.*', 'resource.read'],
      },
      {
        name: 'contractor',
        nameEn: 'Contractor',
        nameBn: 'ঠিকাদার',
        description: 'External contractor management',
        descriptionBn: 'বাহ্যিক ঠিকাদার ব্যবস্থাপনা',
        level: 4,
        priority: 50,
        permissions: ['project.read', 'document.read', 'finance.invoice.create'],
      },
      {
        name: 'accountant',
        nameEn: 'Accountant',
        nameBn: 'হিসাবরক্ষক',
        description: 'Financial operations and NBR compliance',
        descriptionBn: 'আর্থিক কার্যক্রম এবং এনবিআর সম্মতি',
        level: 3,
        priority: 65,
        permissions: ['finance.*', 'compliance.nbr.*', 'report.financial.*'],
      },
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name, organizationId },
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          ...roleData,
          organizationId,
          isActive: true,
        });
        await this.roleRepository.save(role);
      }
    }
  }
}