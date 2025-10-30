const faker = require('@faker-js/faker').faker;
const fs = require('fs');
const path = require('path');

module.exports = {
  // Generate file upload data
  generateFileUpload: function(context, ee, next) {
    const fileTypes = ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'zip'];
    const categories = ['contracts', 'invoices', 'reports', 'blueprints', 'photos', 'documents'];
    
    context.vars.fileType = faker.helpers.arrayElement(fileTypes);
    context.vars.fileCategory = faker.helpers.arrayElement(categories);
    context.vars.fileName = faker.system.fileName({ extensionCount: 0 }) + '.' + context.vars.fileType;
    context.vars.fileTitle = faker.company.catchPhrase() + ' ' + faker.word.noun();
    context.vars.fileSize = faker.number.int({ min: 1024, max: 10485760 }); // 1KB to 10MB
    
    // Generate tags
    context.vars.fileTags = [
      faker.helpers.arrayElement(['dhaka', 'chittagong', 'sylhet']),
      faker.helpers.arrayElement(['2025', '2024', '2023']),
      faker.helpers.arrayElement(['construction', 'engineering', 'infrastructure']),
    ].join(',');
    
    return next();
  },

  // Create test files if they don't exist
  ensureTestFiles: function(context, ee, next) {
    const fixturesDir = path.join(__dirname, '../fixtures');
    
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create different sized test files
    const sizes = [
      { name: 'sample-small.pdf', size: 1024 * 100 },      // 100KB
      { name: 'sample-1mb.pdf', size: 1024 * 1024 },       // 1MB
      { name: 'sample-5mb.pdf', size: 1024 * 1024 * 5 },   // 5MB
      { name: 'sample-10mb.pdf', size: 1024 * 1024 * 10 }, // 10MB
      { name: 'test-1mb.pdf', size: 1024 * 1024 },         // 1MB
    ];
    
    sizes.forEach(file => {
      const filePath = path.join(fixturesDir, file.name);
      if (!fs.existsSync(filePath)) {
        // Create dummy file with specified size
        const buffer = Buffer.alloc(file.size);
        // Add PDF header for realistic testing
        buffer.write('%PDF-1.4');
        fs.writeFileSync(filePath, buffer);
      }
    });
    
    // Create test CSV for bulk data
    const csvPath = path.join(fixturesDir, 'test-files.csv');
    if (!fs.existsSync(csvPath)) {
      const csvContent = [
        'filename,size,type',
        'document-001.pdf,small,pdf',
        'document-002.pdf,1mb,pdf',
        'document-003.pdf,5mb,pdf',
      ].join('\n');
      fs.writeFileSync(csvPath, csvContent);
    }
    
    return next();
  },

  // Generate multipart upload chunks
  $generateChunk: function(size) {
    // Generate base64 encoded chunk of specified size
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer.toString('base64');
  },

  // Generate parts list for multipart completion
  $generatePartsList: function(count) {
    const parts = [];
    for (let i = 1; i <= count; i++) {
      parts.push({
        partNumber: i,
        etag: `"${faker.string.alphanumeric(32)}"`,
      });
    }
    return parts;
  },

  // Initialize large file upload
  initiateLargeUpload: function(context, ee, next) {
    context.vars.uploadId = faker.string.uuid();
    context.vars.fileName = `large-file-${Date.now()}.zip`;
    context.vars.fileSize = 104857600; // 100MB
    context.vars.chunkSize = 10485760; // 10MB chunks
    context.vars.totalParts = Math.ceil(context.vars.fileSize / context.vars.chunkSize);
    
    return next();
  },

  // Upload individual part
  uploadPart: function(context, ee, next) {
    const partNumber = context.vars.$loopCount || 1;
    const isLastPart = partNumber === context.vars.totalParts;
    const partSize = isLastPart 
      ? context.vars.fileSize % context.vars.chunkSize 
      : context.vars.chunkSize;
    
    context.vars.currentPartNumber = partNumber;
    context.vars.currentPartSize = partSize;
    context.vars.currentPartData = module.exports.$generateChunk(Math.min(partSize, 1024)); // Limit for testing
    
    return next();
  },

  // Process file upload response
  processFileResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 201 || response.statusCode === 200) {
      try {
        const body = JSON.parse(response.body);
        
        // Track file IDs
        if (body.fileId) {
          context.vars.uploadedFileId = body.fileId;
        }
        
        // Track storage location
        if (body.bucket && body.key) {
          context.vars.storageBucket = body.bucket;
          context.vars.storageKey = body.key;
        }
        
        // Track processing metrics
        if (body.processingTime) {
          ee.emit('customStat', 'file.processing.time', body.processingTime);
        }
        
        // Track thumbnail generation
        if (body.thumbnails) {
          ee.emit('counter', 'thumbnails.generated', Object.keys(body.thumbnails).length);
        }
      } catch (e) {
        // Silent fail
      }
    }
    return next();
  },

  // Generate presigned URL request
  generatePresignedRequest: function(context, ee, next) {
    context.vars.presignedExpiry = faker.helpers.arrayElement([
      300,    // 5 minutes
      3600,   // 1 hour
      86400,  // 24 hours
      604800, // 7 days
    ]);
    
    context.vars.presignedPermissions = faker.helpers.arrayElement(['read', 'write', 'delete']);
    
    return next();
  },

  // Track storage metrics
  trackStorageMetrics: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 && response.body) {
      try {
        const body = JSON.parse(response.body);
        
        // Track storage usage
        if (body.storageUsed) {
          ee.emit('customStat', 'storage.used.bytes', body.storageUsed);
        }
        
        // Track file counts
        if (body.fileCount) {
          ee.emit('customStat', 'storage.file.count', body.fileCount);
        }
        
        // Track bandwidth
        if (body.bandwidth) {
          ee.emit('customStat', 'storage.bandwidth.bytes', body.bandwidth);
        }
      } catch (e) {
        // Silent fail
      }
    }
    return next();
  },

  // Generate search parameters
  generateSearchParams: function(context, ee, next) {
    context.vars.searchQuery = faker.helpers.arrayElement([
      'contract',
      'invoice',
      'report',
      'blueprint',
      'dhaka metro',
      faker.company.name(),
    ]);
    
    context.vars.searchFilters = {
      category: faker.helpers.arrayElement(['contracts', 'invoices', 'reports', null]),
      dateFrom: faker.date.past().toISOString().split('T')[0],
      dateTo: faker.date.recent().toISOString().split('T')[0],
      minSize: faker.number.int({ min: 0, max: 1048576 }),
      maxSize: faker.number.int({ min: 1048576, max: 10485760 }),
    };
    
    return next();
  }
};