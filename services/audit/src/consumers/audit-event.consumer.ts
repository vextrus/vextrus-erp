import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AuditService } from '../services/audit.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditEventType, AuditSeverity, AuditOutcome } from '../entities/audit-log.entity';

@Injectable()
export class AuditEventConsumer {
  private readonly logger = new Logger(AuditEventConsumer.name);

  constructor(private readonly auditService: AuditService) {}

  @EventPattern('audit.event')
  async handleAuditEvent(@Payload() data: any, @Ctx() context: KafkaContext): Promise<void> {
    try {
      const message = context.getMessage();
      const { value, headers } = message;
      
      // Parse the value if it's a Buffer
      const parsedValue = value ? (Buffer.isBuffer(value) ? JSON.parse(value.toString()) : value) : {};
      
      const tenantId = headers?.['x-tenant-id']?.toString() || 'system';
      
      const auditData: CreateAuditLogDto = {
        action: parsedValue.action || 'unknown',
        entity_type: parsedValue.entity_type || parsedValue.resource_type || 'unknown',
        event_type: this.mapEventType(parsedValue.event_type),
        severity: this.mapSeverity(parsedValue.severity),
        outcome: this.mapOutcome(parsedValue.outcome),
        user_id: parsedValue.user_id,
        username: parsedValue.username,
        user_email: parsedValue.user_email,
        user_role: parsedValue.user_role,
        service_name: parsedValue.service_name || 'unknown',
        resource_type: parsedValue.resource_type,
        resource_id: parsedValue.resource_id,
        resource_name: parsedValue.resource_name,
        description: parsedValue.description,
        details: parsedValue.details,
        ip_address: parsedValue.ip_address,
        user_agent: parsedValue.user_agent,
        session_id: parsedValue.session_id,
        correlation_id: parsedValue.correlation_id || headers?.['correlation-id']?.toString(),
        request_id: parsedValue.request_id || headers?.['request-id']?.toString(),
        http_method: parsedValue.http_method,
        request_path: parsedValue.request_path,
        response_status: parsedValue.response_status,
        response_time_ms: parsedValue.response_time_ms,
        error_message: parsedValue.error_message,
        stack_trace: parsedValue.stack_trace,
        is_sensitive: parsedValue.is_sensitive || false,
      };

      await this.auditService.createAuditLog(tenantId, auditData);
      
      this.logger.log(`Processed audit event: ${parsedValue.event_type} for tenant: ${tenantId}`);
    } catch (error: any) {
      this.logger.error('Failed to process audit event:', error);
    }
  }

  @EventPattern('user.event')
  async handleUserEvent(@Payload() data: any, @Ctx() context: KafkaContext): Promise<void> {
    try {
      const message = context.getMessage();
      const { value, headers } = message;
      
      if (!value) {
        this.logger.warn('Received null value in user event');
        return;
      }
      
      if (!headers) {
        this.logger.warn('Received message without headers');
        return;
      }

      // Parse the value if it's a Buffer
      const parsedValue = Buffer.isBuffer(value) ? JSON.parse(value.toString()) : value;
      const tenantId = headers['x-tenant-id']?.toString() || 'system';

      let eventType: AuditEventType;
      switch (parsedValue.action) {
        case 'created':
          eventType = AuditEventType.USER_CREATE;
          break;
        case 'updated':
          eventType = AuditEventType.USER_UPDATE;
          break;
        case 'deleted':
          eventType = AuditEventType.USER_DELETE;
          break;
        case 'login':
          eventType = AuditEventType.AUTH_LOGIN;
          break;
        case 'logout':
          eventType = AuditEventType.AUTH_LOGOUT;
          break;
        default:
          eventType = AuditEventType.USER_UPDATE;
      }

      const auditData: CreateAuditLogDto = {
        action: parsedValue.action || 'user_update',
        entity_type: 'user',
        event_type: eventType,
        severity: AuditSeverity.INFO,
        outcome: AuditOutcome.SUCCESS,
        user_id: parsedValue.user_id,
        username: parsedValue.username,
        user_email: parsedValue.email,
        service_name: 'user-service',
        resource_type: 'user',
        resource_id: parsedValue.user_id,
        description: `User ${parsedValue.action}: ${parsedValue.username}`,
        details: parsedValue,
      };

      await this.auditService.createAuditLog(tenantId, auditData);
    } catch (error: any) {
      this.logger.error('Failed to process user event:', error);
    }
  }

  @EventPattern('file.event')
  async handleFileEvent(@Payload() data: any, @Ctx() context: KafkaContext): Promise<void> {
    try {
      const message = context.getMessage();
      const { value, headers } = message;
      
      if (!value) {
        this.logger.warn('Received null value in file event');
        return;
      }
      
      if (!headers) {
        this.logger.warn('Received message without headers');
        return;
      }

      // Parse the value if it's a Buffer
      const parsedValue = Buffer.isBuffer(value) ? JSON.parse(value.toString()) : value;
      const tenantId = headers['x-tenant-id']?.toString() || 'system';

      let eventType: AuditEventType;
      switch (parsedValue.action) {
        case 'upload':
          eventType = AuditEventType.FILE_UPLOAD;
          break;
        case 'download':
          eventType = AuditEventType.FILE_DOWNLOAD;
          break;
        case 'delete':
          eventType = AuditEventType.FILE_DELETE;
          break;
        case 'share':
          eventType = AuditEventType.FILE_SHARE;
          break;
        default:
          eventType = AuditEventType.FILE_UPLOAD;
      }

      const auditData: CreateAuditLogDto = {
        action: parsedValue.action || 'file_upload',
        entity_type: 'file',
        event_type: eventType,
        severity: AuditSeverity.INFO,
        outcome: AuditOutcome.SUCCESS,
        user_id: parsedValue.user_id,
        service_name: 'file-storage-service',
        resource_type: 'file',
        resource_id: parsedValue.file_id,
        resource_name: parsedValue.file_name,
        description: `File ${parsedValue.action}: ${parsedValue.file_name}`,
        details: {
          file_size: parsedValue.file_size,
          mime_type: parsedValue.mime_type,
          ...parsedValue,
        },
      };

      await this.auditService.createAuditLog(tenantId, auditData);
    } catch (error: any) {
      this.logger.error('Failed to process file event:', error);
    }
  }

  @EventPattern('security.event')
  async handleSecurityEvent(@Payload() data: any, @Ctx() context: KafkaContext): Promise<void> {
    try {
      const message = context.getMessage();
      const { value, headers } = message;
      
      if (!value) {
        this.logger.warn('Received null value in security event');
        return;
      }
      
      if (!headers) {
        this.logger.warn('Received message without headers');
        return;
      }

      // Parse the value if it's a Buffer
      const parsedValue = Buffer.isBuffer(value) ? JSON.parse(value.toString()) : value;
      const tenantId = headers['x-tenant-id']?.toString() || 'system';

      let eventType: AuditEventType;
      switch (parsedValue.type) {
        case 'access_denied':
          eventType = AuditEventType.SECURITY_ACCESS_DENIED;
          break;
        case 'suspicious_activity':
          eventType = AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY;
          break;
        case 'brute_force':
          eventType = AuditEventType.SECURITY_BRUTE_FORCE;
          break;
        default:
          eventType = AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY;
      }

      const auditData: CreateAuditLogDto = {
        action: parsedValue.action || 'security_event',
        entity_type: parsedValue.resource_type || 'security',
        event_type: eventType,
        severity: parsedValue.severity || AuditSeverity.WARNING,
        outcome: AuditOutcome.FAILURE,
        user_id: parsedValue.user_id,
        service_name: parsedValue.service_name || 'security-service',
        resource_type: parsedValue.resource_type,
        resource_id: parsedValue.resource_id,
        description: parsedValue.description,
        ip_address: parsedValue.ip_address,
        details: parsedValue,
        error_message: parsedValue.error_message,
      };

      await this.auditService.createAuditLog(tenantId, auditData);
      
      // For critical security events, trigger additional actions
      if (parsedValue.severity === 'critical') {
        this.logger.warn(`Critical security event: ${parsedValue.type} for tenant: ${tenantId}`);
        // Could trigger alerts, notifications, etc.
      }
    } catch (error: any) {
      this.logger.error('Failed to process security event:', error);
    }
  }

  private mapEventType(type: string): AuditEventType {
    // Map external event types to internal enum
    const typeMap: Record<string, AuditEventType> = {
      'user.login': AuditEventType.AUTH_LOGIN,
      'user.logout': AuditEventType.AUTH_LOGOUT,
      'user.created': AuditEventType.USER_CREATE,
      'user.updated': AuditEventType.USER_UPDATE,
      'user.deleted': AuditEventType.USER_DELETE,
      'data.created': AuditEventType.DATA_CREATE,
      'data.read': AuditEventType.DATA_READ,
      'data.updated': AuditEventType.DATA_UPDATE,
      'data.deleted': AuditEventType.DATA_DELETE,
      'file.uploaded': AuditEventType.FILE_UPLOAD,
      'file.downloaded': AuditEventType.FILE_DOWNLOAD,
      'file.deleted': AuditEventType.FILE_DELETE,
    };

    return typeMap[type] || AuditEventType.DATA_READ;
  }

  private mapSeverity(severity: string): AuditSeverity {
    const severityMap: Record<string, AuditSeverity> = {
      'info': AuditSeverity.INFO,
      'warning': AuditSeverity.WARNING,
      'error': AuditSeverity.ERROR,
      'critical': AuditSeverity.CRITICAL,
    };

    return severityMap[severity?.toLowerCase()] || AuditSeverity.INFO;
  }

  private mapOutcome(outcome: string): AuditOutcome {
    const outcomeMap: Record<string, AuditOutcome> = {
      'success': AuditOutcome.SUCCESS,
      'failure': AuditOutcome.FAILURE,
      'partial': AuditOutcome.PARTIAL,
      'pending': AuditOutcome.PENDING,
    };

    return outcomeMap[outcome?.toLowerCase()] || AuditOutcome.SUCCESS;
  }
}