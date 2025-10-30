const fs = require('fs');
const path = require('path');

// List of services that need config fixes
const services = [
  { name: 'workflow', port: 3011 },
  { name: 'rules-engine', port: 3012 },
  { name: 'api-gateway', port: 4000 }
];

services.forEach(service => {
  const configPath = path.join(__dirname, '..', 'services', service.name, 'src', 'config', 'configuration.ts');
  
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Fix database credentials
    content = content.replace(/DATABASE_USER\s*\|\|\s*['"]postgres['"]/g, "DATABASE_USERNAME || 'vextrus'");
    content = content.replace(/DATABASE_PASSWORD\s*\|\|\s*['"]postgres['"]/g, "DATABASE_PASSWORD || 'vextrus_dev_2024'");
    
    // Fix Redis password
    content = content.replace(/REDIS_PASSWORD,/g, "REDIS_PASSWORD || 'vextrus_redis_2024',");
    content = content.replace(/REDIS_PASSWORD\s*\|\|\s*undefined/g, "REDIS_PASSWORD || 'vextrus_redis_2024'");
    
    // Fix port numbers
    content = content.replace(/APP_PORT\s*\|\|\s*['"]\d+['"]/g, `APP_PORT || '${service.port}'`);
    content = content.replace(/http:\/\/localhost:\d+/g, `http://localhost:${service.port}`);
    
    // Remove schema configuration if it exists
    content = content.replace(/^\s*schema:\s*process\.env\.\w+\s*\|\|\s*['"][\w_]+['"]\s*,?\s*$/gm, '');
    
    fs.writeFileSync(configPath, content);
    console.log(`✅ Fixed configuration for ${service.name} service (port ${service.port})`);
  } else {
    console.log(`⚠️  Configuration file not found for ${service.name} service`);
  }
});

console.log('\n✅ All service configurations fixed!');
console.log('Services will restart automatically if running in watch mode.');