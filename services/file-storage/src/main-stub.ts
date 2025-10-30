import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import express from 'express';

async function bootstrap() {
  const app = express();
  const logger = new Logger('FileStorageService');
  const port = process.env.PORT || 3008;

  // Basic health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'file-storage',
      timestamp: new Date().toISOString(),
      features: {
        upload: 'stub',
        download: 'stub',
        thumbnail: 'stub',
        minio: 'stub'
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
              files: [File]
              folders: [Folder]
            }
            type File {
              id: String
              name: String
              size: Int
              mimeType: String
            }
            type Folder {
              id: String
              name: String
            }
          `
        }
      }
    });
  });

  // File upload endpoint stub
  app.post('/files/upload', (req, res) => {
    res.json({
      id: Math.random().toString(36).substr(2, 9),
      name: 'uploaded-file.txt',
      size: 1024,
      url: 'http://minio:9000/bucket/file.txt',
      message: 'File uploaded (stub)'
    });
  });

  // File download endpoint stub
  app.get('/files/:id/download', (req, res) => {
    res.json({
      url: `http://minio:9000/bucket/${req.params.id}`,
      expires: new Date(Date.now() + 3600000).toISOString(),
      message: 'Download URL generated (stub)'
    });
  });

  app.listen(port, () => {
    logger.log(`File Storage service (stub) is running on port ${port}`);
  });
}

bootstrap();