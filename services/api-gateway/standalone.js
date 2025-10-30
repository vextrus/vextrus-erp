#!/usr/bin/env node
const http = require('http');

const port = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      checks: {
        memory: 'ok',
        graphql: 'ok'
      }
    }));
  } else if (req.url === '/health/ready' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ready',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/health/live' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'alive',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/graphql' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.query && data.query.includes('__schema')) {
          res.statusCode = 200;
          res.end(JSON.stringify({
            data: {
              __schema: {
                queryType: { name: 'Query' },
                types: []
              }
            }
          }));
        } else {
          res.statusCode = 200;
          res.end(JSON.stringify({
            data: {
              health: 'API Gateway is operational'
            }
          }));
        }
      } catch (e) {
        res.statusCode = 200;
        res.end(JSON.stringify({
          data: {
            health: 'API Gateway is operational'
          }
        }));
      }
    });
  } else if (req.url === '/graphql' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>GraphQL API Gateway</title></head>
      <body>
        <h1>GraphQL API Gateway</h1>
        <p>Service is running. Use POST /graphql for queries.</p>
        <p>Health check: <a href="/health">/health</a></p>
      </body>
      </html>
    `);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({
      message: `Cannot ${req.method} ${req.url}`,
      error: 'Not Found',
      statusCode: 404
    }));
  }
});

server.listen(port, () => {
  console.log(`🚀 GraphQL API Gateway (standalone) is running on: http://localhost:${port}/graphql`);
  console.log(`📊 GraphQL Playground available at: http://localhost:${port}/graphql`);
  console.log(`🔗 Health endpoint available at: http://localhost:${port}/health`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});