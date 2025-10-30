import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerConfig {
  static setup(app: INestApplication, serviceName: string, port: number) {
    const config = new DocumentBuilder()
      .setTitle(`Vextrus ERP - ${serviceName}`)
      .setDescription(this.getServiceDescription(serviceName))
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Tenant-Id',
          in: 'header',
          description: 'Tenant identifier for multi-tenant isolation',
        },
        'tenant-id',
      )
      .addTag('Core', 'Core functionality')
      .addTag('Bangladesh', 'Bangladesh-specific features')
      .addTag('RBAC', 'Role-based access control')
      .addServer(`http://localhost:${port}`, 'Local Development')
      .addServer('https://api.vextrus.com', 'Production')
      .addServer('https://staging-api.vextrus.com', 'Staging')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
      deepScanRoutes: true,
    });

    // Add Bangladesh-specific examples
    this.addBangladeshExamples(document, serviceName);
    
    // Add RBAC permission requirements
    this.addRBACPermissions(document, serviceName);
    
    // Add multi-language response examples
    this.addMultiLanguageExamples(document);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
          // Add default tenant ID if not present
          if (!req.headers['X-Tenant-Id']) {
            req.headers['X-Tenant-Id'] = 'demo-tenant';
          }
          return req;
        },
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: `${serviceName} API Documentation`,
      customfavIcon: '/favicon.ico',
    });

    return document;
  }

  private static getServiceDescription(serviceName: string): string {
    const descriptions: Record<string, string> = {
      'Notification Service': `
        Multi-channel notification service supporting Email, SMS, and Push notifications.
        
        **Features:**
        - SendGrid integration for email
        - Bangladesh SMS providers (Alpha SMS, SMS.NET.BD)
        - Firebase Cloud Messaging for push notifications
        - Template management with Bengali language support
        - Bulk notification processing with rate limiting
        - Delivery tracking and analytics
        
        **Bangladesh-Specific:**
        - Phone number validation (+880 format)
        - Bengali (বাংলা) template support
        - Cost tracking in BDT for SMS
        - Local provider failover
      `,
      'File Storage Service': `
        S3-compatible file storage service using MinIO.
        
        **Features:**
        - Multi-tenant file isolation
        - Image thumbnail generation
        - File versioning
        - Presigned URLs for secure access
        - Virus scanning with ClamAV
        - Storage quota management
        
        **Supported Formats:**
        - Documents: PDF, DOCX, XLSX, PPTX
        - Images: JPG, PNG, GIF, WebP
        - Archives: ZIP, RAR, 7Z
        - Max file size: 100MB (configurable)
      `,
      'Audit Service': `
        Comprehensive audit logging and compliance tracking.
        
        **Features:**
        - Real-time event capture
        - Elasticsearch integration for search
        - Compliance reporting (SOX, GDPR, PCI-DSS, HIPAA)
        - Retention policies
        - Anomaly detection
        
        **Bangladesh Compliance:**
        - BTRC data localization
        - NBR tax audit trails
        - RAJUK submission tracking
      `,
      'RBAC Service': `
        Role-Based Access Control with hierarchical permissions.
        
        **Roles (Bangladesh Construction Context):**
        - System Admin
        - Organization Owner  
        - Project Director
        - Project Manager
        - Site Engineer
        - Site Supervisor
        - Contractor
        - Accountant
        - HR Manager
        - Procurement Officer
        - Quality Inspector
        - Safety Officer
        - Document Controller
        - Viewer
        
        **Features:**
        - Hierarchical role inheritance
        - Temporal role assignments
        - Project-specific permissions
        - Department-based access
        - Delegation workflows
      `,
      'Configuration Service': `
        Dynamic configuration and feature flag management.
        
        **Features:**
        - Feature flags with tenant/user targeting
        - A/B testing support
        - Configuration versioning
        - Real-time updates via WebSocket
        - Redis caching
        - Audit trail for changes
      `,
      'Import/Export Service': `
        Bulk data processing and migration service.
        
        **Features:**
        - CSV, Excel, JSON, XML support
        - Async processing with Bull queues
        - Data validation and transformation
        - Progress tracking
        - Error recovery
        
        **Bangladesh Validators:**
        - Phone number format (+880)
        - TIN validation (12 digits)
        - NID validation (10/13/17 digits)
        - Post code validation (4 digits)
      `,
      'Document Generator Service': `
        Dynamic document generation in multiple formats.
        
        **Features:**
        - PDF generation with templates
        - Excel report generation
        - Word document creation
        - QR code and barcode support
        - Digital signatures
        - Watermarking
        
        **Bangladesh Templates:**
        - Invoices with VAT calculations
        - Pay slips in Bengali
        - Government form templates
        - Construction permits (RAJUK)
      `,
    };

    return descriptions[serviceName] || 'Microservice API documentation';
  }

  private static addBangladeshExamples(document: any, serviceName: string) {
    // Add Bangladesh-specific request/response examples
    if (serviceName === 'Notification Service') {
      document.paths['/api/v1/notifications/send-sms'] = {
        ...document.paths['/api/v1/notifications/send-sms'],
        post: {
          ...document.paths['/api/v1/notifications/send-sms']?.post,
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  'bangladesh-otp': {
                    summary: 'Send OTP to Bangladesh number',
                    value: {
                      phone: '+8801712345678',
                      message: 'আপনার OTP কোড: 123456',
                      provider: 'alpha_sms',
                      priority: 'high',
                    },
                  },
                  'payment-notification': {
                    summary: 'Payment confirmation SMS',
                    value: {
                      phone: '+8801898765432',
                      message: 'পেমেন্ট সফল: ৫০,০০০ টাকা। রেফারেন্স: TXN123456',
                      provider: 'sms_net_bd',
                      priority: 'normal',
                    },
                  },
                },
              },
            },
          },
        },
      };
    }
  }

  private static addRBACPermissions(document: any, serviceName: string) {
    // Add RBAC permission requirements to each endpoint
    Object.keys(document.paths).forEach(path => {
      Object.keys(document.paths[path]).forEach(method => {
        const operation = document.paths[path][method];
        
        // Map endpoints to required permissions
        const permissionMap: Record<string, string[]> = {
          'POST /api/v1/projects': ['project.create'],
          'GET /api/v1/projects': ['project.read'],
          'PUT /api/v1/projects/{id}': ['project.update'],
          'DELETE /api/v1/projects/{id}': ['project.delete'],
          'POST /api/v1/projects/{id}/approve': ['project.approve', 'budget.approve'],
          'GET /api/v1/audit-logs': ['audit.view'],
          'POST /api/v1/users': ['user.manage'],
          'PUT /api/v1/roles/{id}': ['role.manage'],
        };

        const requiredPermissions = permissionMap[`${method.toUpperCase()} ${path}`];
        
        if (requiredPermissions) {
          operation.security = [
            {
              'JWT-auth': [],
              'tenant-id': [],
            },
          ];
          
          operation.description = (operation.description || '') + `
            
            **Required Permissions:** ${requiredPermissions.join(', ')}
            
            **Role Examples:**
            - System Admin: ✅ Full access
            - Project Manager: ${requiredPermissions.includes('project.create') ? '✅' : '❌'}
            - Viewer: ${requiredPermissions.includes('project.read') && requiredPermissions.length === 1 ? '✅' : '❌'}
          `;
        }
      });
    });
  }

  private static addMultiLanguageExamples(document: any) {
    // Add bilingual response examples
    document.components = document.components || {};
    document.components.examples = {
      ...document.components.examples,
      'bilingual-success': {
        summary: 'Bilingual success response',
        value: {
          success: true,
          message: 'Operation successful',
          message_bn: 'অপারেশন সফল',
          data: {
            id: 'proj-123',
            name: 'Dhaka Metro Rail',
            name_bn: 'ঢাকা মেট্রো রেল',
            status: 'APPROVED',
            status_bn: 'অনুমোদিত',
          },
        },
      },
      'bilingual-error': {
        summary: 'Bilingual error response',
        value: {
          success: false,
          error: 'Insufficient permissions',
          error_bn: 'অপর্যাপ্ত অনুমতি',
          code: 'PERMISSION_DENIED',
          details: {
            required: ['project.approve'],
            current: ['project.read'],
          },
        },
      },
      'validation-error-bangladesh': {
        summary: 'Bangladesh-specific validation error',
        value: {
          success: false,
          error: 'Validation failed',
          error_bn: 'যাচাইকরণ ব্যর্থ',
          errors: [
            {
              field: 'phone',
              message: 'Invalid Bangladesh phone number',
              message_bn: 'অবৈধ বাংলাদেশ ফোন নম্বর',
              expected: '+880XXXXXXXXXX',
            },
            {
              field: 'tin',
              message: 'TIN must be 12 digits',
              message_bn: 'TIN ১২ সংখ্যার হতে হবে',
            },
          ],
        },
      },
    };
  }
}