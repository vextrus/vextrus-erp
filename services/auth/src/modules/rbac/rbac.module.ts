import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { RbacService } from './rbac.service';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { PermissionGuard } from './guards/permission.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, UserRole, User]),
  ],
  controllers: [RoleController, PermissionController],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}