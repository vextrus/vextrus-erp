const faker = require('@faker-js/faker').faker;

module.exports = {
  // Generate Bangladesh phone numbers
  $randomBangladeshPhone: function() {
    const operators = ['17', '18', '19', '16', '15', '13'];
    const operator = faker.helpers.arrayElement(operators);
    const number = faker.string.numeric(8);
    return `+880${operator}${number}`;
  },

  // Generate recipient lists
  $generateRecipients: function(count) {
    const recipients = [];
    for (let i = 0; i < count; i++) {
      recipients.push({
        email: faker.internet.email({ provider: 'company.bd' }),
        phone: module.exports.$randomBangladeshPhone(),
        name: faker.person.fullName(),
        userId: faker.string.uuid(),
      });
    }
    return recipients;
  },

  // Generate device tokens for push notifications
  $generateDeviceTokens: function(count) {
    const tokens = [];
    for (let i = 0; i < count; i++) {
      // Generate realistic FCM tokens
      tokens.push('fcm:' + faker.string.alphanumeric(152));
    }
    return tokens;
  },

  // Bangladesh-specific SMS content
  generateBengaliContent: function(context, ee, next) {
    const templates = [
      'আপনার OTP কোড: {{otp}}',
      'পেমেন্ট সফল: {{amount}} টাকা',
      'প্রকল্প অনুমোদিত: {{project}}',
      'মিটিং রিমাইন্ডার: {{time}}',
      'নতুন টাস্ক অ্যাসাইন করা হয়েছে',
    ];
    
    context.vars.smsContent = faker.helpers.arrayElement(templates)
      .replace('{{otp}}', faker.string.numeric(6))
      .replace('{{amount}}', faker.number.int({ min: 100, max: 100000 }))
      .replace('{{project}}', faker.company.name())
      .replace('{{time}}', faker.date.future().toLocaleTimeString('bn-BD'));
    
    return next();
  },

  // Process notification response
  processNotificationResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 202) {
      try {
        const body = JSON.parse(response.body);
        
        // Track job IDs for status checking
        if (body.jobId) {
          context.vars.notificationJobId = body.jobId;
        }
        
        // Track costs for SMS
        if (body.estimatedCost) {
          context.vars.smsCost = body.estimatedCost;
          ee.emit('customStat', 'sms.cost.bdt', body.estimatedCost);
        }
        
        // Track batch information
        if (body.batchId) {
          context.vars.batchId = body.batchId;
          context.vars.totalRecipients = body.totalRecipients;
        }
      } catch (e) {
        // Silent fail
      }
    }
    return next();
  },

  // Generate email templates
  generateEmailContent: function(context, ee, next) {
    const templates = ['welcome', 'project_update', 'invoice', 'reminder', 'security_alert'];
    
    context.vars.emailTemplate = faker.helpers.arrayElement(templates);
    context.vars.emailData = {
      userName: faker.person.fullName(),
      projectName: faker.company.name() + ' Construction',
      amount: faker.number.int({ min: 10000, max: 1000000 }),
      date: faker.date.future().toLocaleDateString('en-BD'),
      invoiceNumber: 'INV-' + faker.string.numeric(6),
    };
    
    return next();
  },

  // Push notification data
  generatePushData: function(context, ee, next) {
    context.vars.pushData = {
      title: faker.helpers.arrayElement([
        'New Task Assigned',
        'Project Update',
        'Payment Received',
        'Approval Required',
        'Meeting Reminder',
      ]),
      body: faker.lorem.sentence(),
      data: {
        type: faker.helpers.arrayElement(['task', 'project', 'payment', 'approval', 'meeting']),
        id: faker.string.uuid(),
        timestamp: Date.now(),
        deepLink: `vextrus://${faker.helpers.arrayElement(['tasks', 'projects', 'payments'])}/${faker.string.uuid()}`,
      },
      priority: faker.helpers.arrayElement(['normal', 'high']),
      ttl: faker.number.int({ min: 300, max: 86400 }),
    };
    
    return next();
  },

  // Track delivery metrics
  trackDeliveryMetrics: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 && response.body) {
      try {
        const body = JSON.parse(response.body);
        
        if (body.status === 'delivered') {
          ee.emit('counter', 'notifications.delivered', 1);
        } else if (body.status === 'failed') {
          ee.emit('counter', 'notifications.failed', 1);
        } else if (body.status === 'pending') {
          ee.emit('counter', 'notifications.pending', 1);
        }
        
        // Track channel-specific metrics
        if (body.channel) {
          ee.emit('counter', `notifications.${body.channel}.sent`, 1);
        }
      } catch (e) {
        // Silent fail
      }
    }
    return next();
  }
};