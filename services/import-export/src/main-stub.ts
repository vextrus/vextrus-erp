import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import express from 'express';

async function bootstrap() {
  const app = express();
  const logger = new Logger('ImportExportService');
  const port = process.env.PORT || 3009;

  // Basic health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'import-export',
      timestamp: new Date().toISOString(),
      features: {
        import: 'stub',
        export: 'stub',
        dataMapping: 'stub'
      }
    });
  });

  // GraphQL stub endpoint
  app.post('/graphql', (req, res) => {
    res.json({
      data: {
        _service: {
          sdl: `
            type Query {
              importJobs: [ImportJob]
              exportJobs: [ExportJob]
            }
            type ImportJob {
              id: String
              status: String
            }
            type ExportJob {
              id: String
              status: String
            }
          `
        }
      }
    });
  });

  // Import endpoint stub
  app.post('/import', (req, res) => {
    res.json({
      id: Math.random().toString(36).substr(2, 9),
      status: 'queued',
      message: 'Import job created (stub)'
    });
  });

  // Export endpoint stub
  app.post('/export', (req, res) => {
    res.json({
      id: Math.random().toString(36).substr(2, 9),
      status: 'queued',
      message: 'Export job created (stub)'
    });
  });

  app.listen(port, () => {
    logger.log(`Import-Export service (stub) is running on port ${port}`);
  });
}

bootstrap();