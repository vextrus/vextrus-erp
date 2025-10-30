import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AuditEventType } from '../entities/audit-log.entity';
import { 
  GenerateComplianceReportDto, 
  ComplianceMetricsDto, 
  ComplianceStandard,
  DataPrivacyReportDto 
} from '../dto/compliance-report.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async generateComplianceReport(
    tenantId: string,
    dto: GenerateComplianceReportDto
  ): Promise<any> {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    const report = {
      standard: dto.standard,
      period: {
        start: startDate,
        end: endDate,
      },
      generated_at: new Date(),
      sections: {},
    };

    // Get relevant audit logs
    const logs = await this.auditLogRepository.find({
      where: {
        tenant_id: tenantId,
        timestamp: Between(startDate, endDate),
      },
    });

    // Generate sections based on compliance standard
    switch (dto.standard) {
      case ComplianceStandard.SOX:
        report.sections = await this.generateSOXReport(logs, dto);
        break;
      case ComplianceStandard.GDPR:
        report.sections = await this.generateGDPRReport(logs, dto);
        break;
      case ComplianceStandard.PCI_DSS:
        report.sections = await this.generatePCIDSSReport(logs, dto);
        break;
      case ComplianceStandard.HIPAA:
        report.sections = await this.generateHIPAAReport(logs, dto);
        break;
      case ComplianceStandard.BANGLADESH_DIGITAL_SECURITY:
        report.sections = await this.generateBangladeshDigitalSecurityReport(logs, dto);
        break;
      case ComplianceStandard.BANGLADESH_ICT:
        report.sections = await this.generateBangladeshICTReport(logs, dto);
        break;
      default:
        report.sections = await this.generateGenericReport(logs, dto);
    }

    // Add statistics if requested
    if (dto.include_statistics) {
      report['statistics'] = this.calculateStatistics(logs);
    }

    // Add compliance gaps if requested
    if (dto.include_gaps) {
      report['compliance_gaps'] = await this.identifyComplianceGaps(tenantId, dto.standard, logs);
    }

    // Add recommendations if requested
    if (dto.include_recommendations) {
      report['recommendations'] = this.generateRecommendations(dto.standard, report['compliance_gaps']);
    }

    return report;
  }

  private async generateSOXReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      access_controls: {
        title: 'Access Controls (Section 404)',
        description: 'User access management and authentication controls',
        findings: this.analyzeAccessControls(logs),
        compliant: true,
      },
      change_management: {
        title: 'Change Management',
        description: 'System and data change tracking',
        findings: this.analyzeChangeManagement(logs),
        compliant: true,
      },
      segregation_of_duties: {
        title: 'Segregation of Duties',
        description: 'Separation of critical functions',
        findings: this.analyzeSegregationOfDuties(logs),
        compliant: true,
      },
      audit_trail: {
        title: 'Audit Trail Integrity',
        description: 'Complete and tamper-proof audit logging',
        findings: this.analyzeAuditTrailIntegrity(logs),
        compliant: true,
      },
    };
  }

  private async generateGDPRReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      data_access: {
        title: 'Data Access Records (Article 15)',
        description: 'Records of personal data access',
        findings: this.analyzeDataAccess(logs),
        compliant: true,
      },
      consent_management: {
        title: 'Consent Management (Article 7)',
        description: 'User consent tracking and management',
        findings: this.analyzeConsentManagement(logs),
        compliant: true,
      },
      data_portability: {
        title: 'Data Portability (Article 20)',
        description: 'Data export and transfer records',
        findings: this.analyzeDataPortability(logs),
        compliant: true,
      },
      right_to_erasure: {
        title: 'Right to Erasure (Article 17)',
        description: 'Data deletion and anonymization records',
        findings: this.analyzeDataErasure(logs),
        compliant: true,
      },
      breach_notification: {
        title: 'Breach Notification (Article 33)',
        description: 'Security incident detection and reporting',
        findings: this.analyzeBreachNotification(logs),
        compliant: true,
      },
    };
  }

  private async generatePCIDSSReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      access_control: {
        title: 'Requirement 7-8: Access Control',
        description: 'Restrict access to cardholder data',
        findings: this.analyzePCIAccessControl(logs),
        compliant: true,
      },
      authentication: {
        title: 'Requirement 8: Authentication',
        description: 'Identify and authenticate access',
        findings: this.analyzePCIAuthentication(logs),
        compliant: true,
      },
      logging_monitoring: {
        title: 'Requirement 10: Logging and Monitoring',
        description: 'Track and monitor all access',
        findings: this.analyzePCILogging(logs),
        compliant: true,
      },
      security_testing: {
        title: 'Requirement 11: Security Testing',
        description: 'Regular security testing records',
        findings: this.analyzePCISecurityTesting(logs),
        compliant: true,
      },
    };
  }

  private async generateHIPAAReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      access_controls: {
        title: 'Access Controls (§164.312(a))',
        description: 'Technical safeguards for PHI access',
        findings: this.analyzeHIPAAAccessControls(logs),
        compliant: true,
      },
      audit_controls: {
        title: 'Audit Controls (§164.312(b))',
        description: 'Hardware, software, and procedural mechanisms',
        findings: this.analyzeHIPAAAuditControls(logs),
        compliant: true,
      },
      integrity: {
        title: 'Integrity (§164.312(c))',
        description: 'PHI integrity controls',
        findings: this.analyzeHIPAAIntegrity(logs),
        compliant: true,
      },
      transmission_security: {
        title: 'Transmission Security (§164.312(e))',
        description: 'PHI transmission safeguards',
        findings: this.analyzeHIPAATransmission(logs),
        compliant: true,
      },
    };
  }

  private async generateBangladeshDigitalSecurityReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      data_protection: {
        title: 'Data Protection Measures',
        description: 'Digital Security Act 2018 compliance',
        findings: this.analyzeBangladeshDataProtection(logs),
        compliant: true,
      },
      critical_infrastructure: {
        title: 'Critical Information Infrastructure',
        description: 'Protection of critical systems',
        findings: this.analyzeCriticalInfrastructure(logs),
        compliant: true,
      },
      incident_response: {
        title: 'Incident Response',
        description: 'Security incident handling as per DSA',
        findings: this.analyzeIncidentResponse(logs),
        compliant: true,
      },
      user_privacy: {
        title: 'User Privacy Protection',
        description: 'Personal data protection measures',
        findings: this.analyzeBangladeshPrivacy(logs),
        compliant: true,
      },
    };
  }

  private async generateBangladeshICTReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      ict_governance: {
        title: 'ICT Governance',
        description: 'ICT Act 2006 compliance',
        findings: this.analyzeICTGovernance(logs),
        compliant: true,
      },
      electronic_transactions: {
        title: 'Electronic Transactions',
        description: 'Digital transaction integrity',
        findings: this.analyzeElectronicTransactions(logs),
        compliant: true,
      },
      digital_signatures: {
        title: 'Digital Signatures',
        description: 'Digital signature compliance',
        findings: this.analyzeDigitalSignatures(logs),
        compliant: true,
      },
      data_localization: {
        title: 'Data Localization',
        description: 'Local data storage requirements',
        findings: this.analyzeDataLocalization(logs),
        compliant: true,
      },
    };
  }

  private async generateGenericReport(logs: AuditLog[], dto: GenerateComplianceReportDto): Promise<any> {
    return {
      summary: {
        total_events: logs.length,
        period: `${dto.start_date} to ${dto.end_date}`,
      },
      event_distribution: this.calculateEventDistribution(logs),
      user_activity: this.calculateUserActivity(logs),
      security_events: this.identifySecurityEvents(logs),
    };
  }

  private calculateStatistics(logs: AuditLog[]): any {
    const stats = {
      total_events: logs.length,
      by_severity: {},
      by_outcome: {},
      by_service: {},
      failed_operations: 0,
      security_events: 0,
    };

    logs.forEach(log => {
      // By severity
      if (!stats.by_severity[log.severity]) {
        stats.by_severity[log.severity] = 0;
      }
      stats.by_severity[log.severity]++;

      // By outcome
      if (!stats.by_outcome[log.outcome]) {
        stats.by_outcome[log.outcome] = 0;
      }
      stats.by_outcome[log.outcome]++;

      // By service
      if (!stats.by_service[log.service_name]) {
        stats.by_service[log.service_name] = 0;
      }
      stats.by_service[log.service_name]++;

      // Failed operations
      if (log.outcome === 'failure') {
        stats.failed_operations++;
      }

      // Security events
      if (log.event_type.startsWith('security.')) {
        stats.security_events++;
      }
    });

    return stats;
  }

  private async identifyComplianceGaps(
    tenantId: string,
    standard: ComplianceStandard,
    logs: AuditLog[]
  ): Promise<any[]> {
    const gaps: { type: string; severity: string; description: string; standard: string }[] = [];

    // Check for missing required event types based on standard
    const requiredEvents = this.getRequiredEventsForStandard(standard);
    const loggedEventTypes = new Set(logs.map(l => l.event_type));

    requiredEvents.forEach(required => {
      if (!loggedEventTypes.has(required)) {
        gaps.push({
          type: 'missing_event_type',
          severity: 'high',
          description: `Required event type ${required} not found in audit logs`,
          standard,
        });
      }
    });

    // Check for audit log retention
    const oldestLog = logs.length > 0 ? logs.reduce((oldest, log) => 
      !oldest || log.timestamp < oldest.timestamp ? log : oldest, logs[0]) : null;

    if (oldestLog) {
      const retentionDays = Math.floor((Date.now() - oldestLog.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      const requiredRetention = this.getRequiredRetentionDays(standard);

      if (retentionDays < requiredRetention) {
        gaps.push({
          type: 'insufficient_retention',
          severity: 'medium',
          description: `Audit logs retained for ${retentionDays} days, ${requiredRetention} required`,
          standard,
        });
      }
    }

    return gaps;
  }

  private generateRecommendations(standard: ComplianceStandard, gaps: any[]): any[] {
    const recommendations: { priority: string; action: string; description: string }[] = [];

    gaps.forEach(gap => {
      switch (gap.type) {
        case 'missing_event_type':
          recommendations.push({
            priority: 'high',
            action: 'Enable comprehensive audit logging',
            description: `Configure all services to log ${gap.description}`,
          });
          break;
        case 'insufficient_retention':
          recommendations.push({
            priority: 'medium',
            action: 'Extend audit log retention period',
            description: `Increase retention to meet ${standard} requirements`,
          });
          break;
      }
    });

    return recommendations;
  }

  private getRequiredEventsForStandard(standard: ComplianceStandard): AuditEventType[] {
    const eventMap = {
      [ComplianceStandard.SOX]: [
        AuditEventType.AUTH_LOGIN,
        AuditEventType.AUTH_LOGOUT,
        AuditEventType.USER_ROLE_CHANGE,
        AuditEventType.DATA_UPDATE,
        AuditEventType.DATA_DELETE,
      ],
      [ComplianceStandard.GDPR]: [
        AuditEventType.COMPLIANCE_DATA_ACCESS,
        AuditEventType.COMPLIANCE_CONSENT_GIVEN,
        AuditEventType.COMPLIANCE_CONSENT_WITHDRAWN,
        AuditEventType.COMPLIANCE_DATA_DELETION,
      ],
      [ComplianceStandard.PCI_DSS]: [
        AuditEventType.AUTH_LOGIN,
        AuditEventType.AUTH_FAILED,
        AuditEventType.DATA_ACCESS,
        AuditEventType.SECURITY_ACCESS_DENIED,
      ],
      [ComplianceStandard.HIPAA]: [
        AuditEventType.DATA_ACCESS,
        AuditEventType.DATA_UPDATE,
        AuditEventType.DATA_DELETE,
        AuditEventType.DATA_EXPORT,
      ],
    };

    return eventMap[standard] || [];
  }

  private getRequiredRetentionDays(standard: ComplianceStandard): number {
    const retentionMap = {
      [ComplianceStandard.SOX]: 2555, // 7 years
      [ComplianceStandard.GDPR]: 1095, // 3 years
      [ComplianceStandard.PCI_DSS]: 365, // 1 year
      [ComplianceStandard.HIPAA]: 2190, // 6 years
      [ComplianceStandard.BANGLADESH_DIGITAL_SECURITY]: 1825, // 5 years
      [ComplianceStandard.BANGLADESH_ICT]: 1095, // 3 years
    };

    return retentionMap[standard] || 365;
  }

  // Analysis helper methods
  private analyzeAccessControls(logs: AuditLog[]): any {
    return logs.filter(l => 
      l.event_type === AuditEventType.AUTH_LOGIN ||
      l.event_type === AuditEventType.AUTH_LOGOUT ||
      l.event_type === AuditEventType.USER_ROLE_CHANGE
    ).length;
  }

  private analyzeChangeManagement(logs: AuditLog[]): any {
    return logs.filter(l => 
      l.event_type === AuditEventType.DATA_UPDATE ||
      l.event_type === AuditEventType.SYSTEM_CONFIG_CHANGE
    ).length;
  }

  private analyzeSegregationOfDuties(logs: AuditLog[]): any {
    const userActions = {};
    logs.forEach(log => {
      if (!userActions[log.user_id]) {
        userActions[log.user_id] = new Set();
      }
      userActions[log.user_id].add(log.action);
    });
    return userActions;
  }

  private analyzeAuditTrailIntegrity(logs: AuditLog[]): any {
    return logs.filter(l => l.signature).length;
  }

  private analyzeDataAccess(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type === AuditEventType.DATA_READ).length;
  }

  private analyzeConsentManagement(logs: AuditLog[]): any {
    return logs.filter(l => 
      l.event_type === AuditEventType.COMPLIANCE_CONSENT_GIVEN ||
      l.event_type === AuditEventType.COMPLIANCE_CONSENT_WITHDRAWN
    ).length;
  }

  private analyzeDataPortability(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type === AuditEventType.DATA_EXPORT).length;
  }

  private analyzeDataErasure(logs: AuditLog[]): any {
    return logs.filter(l => 
      l.event_type === AuditEventType.DATA_DELETE ||
      l.event_type === AuditEventType.COMPLIANCE_DATA_DELETION
    ).length;
  }

  private analyzeBreachNotification(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type.startsWith('security.')).length;
  }

  private analyzePCIAccessControl(logs: AuditLog[]): any {
    return this.analyzeAccessControls(logs);
  }

  private analyzePCIAuthentication(logs: AuditLog[]): any {
    return logs.filter(l => 
      l.event_type === AuditEventType.AUTH_LOGIN ||
      l.event_type === AuditEventType.AUTH_MFA_ENABLED
    ).length;
  }

  private analyzePCILogging(logs: AuditLog[]): any {
    return logs.length;
  }

  private analyzePCISecurityTesting(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type === AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY).length;
  }

  private analyzeHIPAAAccessControls(logs: AuditLog[]): any {
    return this.analyzeAccessControls(logs);
  }

  private analyzeHIPAAAuditControls(logs: AuditLog[]): any {
    return logs.length;
  }

  private analyzeHIPAAIntegrity(logs: AuditLog[]): any {
    return logs.filter(l => l.signature).length;
  }

  private analyzeHIPAATransmission(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type === AuditEventType.DATA_EXPORT).length;
  }

  private analyzeBangladeshDataProtection(logs: AuditLog[]): any {
    return logs.filter(l => l.compliance_info?.regulation === 'BD_DSA').length;
  }

  private analyzeCriticalInfrastructure(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type.startsWith('system.')).length;
  }

  private analyzeIncidentResponse(logs: AuditLog[]): any {
    return logs.filter(l => l.severity === 'critical' || l.severity === 'error').length;
  }

  private analyzeBangladeshPrivacy(logs: AuditLog[]): any {
    return logs.filter(l => l.is_sensitive).length;
  }

  private analyzeICTGovernance(logs: AuditLog[]): any {
    return logs.filter(l => l.compliance_info?.regulation === 'BD_ICT').length;
  }

  private analyzeElectronicTransactions(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type === AuditEventType.BUSINESS_TRANSACTION).length;
  }

  private analyzeDigitalSignatures(logs: AuditLog[]): any {
    return logs.filter(l => l.signature).length;
  }

  private analyzeDataLocalization(logs: AuditLog[]): any {
    return logs.filter(l => l.location?.country === 'BD').length;
  }

  private calculateEventDistribution(logs: AuditLog[]): any {
    const distribution = {};
    logs.forEach(log => {
      if (!distribution[log.event_type]) {
        distribution[log.event_type] = 0;
      }
      distribution[log.event_type]++;
    });
    return distribution;
  }

  private calculateUserActivity(logs: AuditLog[]): any {
    const activity = {};
    logs.forEach(log => {
      if (!activity[log.user_id]) {
        activity[log.user_id] = {
          username: log.username,
          count: 0,
        };
      }
      activity[log.user_id].count++;
    });
    return activity;
  }

  private identifySecurityEvents(logs: AuditLog[]): any {
    return logs.filter(l => l.event_type.startsWith('security.'));
  }
}