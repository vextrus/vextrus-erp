import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from '../../controllers/audit.controller';
import { AuditService } from '../../services/audit.service';
import { ElasticsearchService } from '../../services/elasticsearch.service';
import { RetentionService } from '../../services/retention.service';
import { AuditConsumer } from '../../consumers/audit.consumer';
import { AuditLog } from '../../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, ElasticsearchService, RetentionService, AuditConsumer],
  exports: [AuditService],
})
export class AuditModule {}
