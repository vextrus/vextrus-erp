import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Organization } from './entities/organization.entity';
import { Division } from './entities/division.entity';
import { OrganizationService } from './services/organization.service';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationResolver } from './graphql/organization.resolver';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Organization, Division]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationResolver],
  exports: [OrganizationService],
})
export class OrganizationModule {}