#!/usr/bin/env node

/**
 * JWT Token Generator for Vextrus ERP Development
 * Generates test JWT tokens for API testing
 */

const crypto = require('crypto');

// JWT Secret from .env
const JWT_SECRET = 'vextrus_jwt_access_secret_dev_2024_change_in_production';

// Token payload (claims)
const payload = {
  sub: 'test-user-001',           // Subject (user ID)
  email: 'test@vextrus.com',      // User email
  tenantId: 'default',            // Tenant ID
  roles: ['admin', 'user'],       // User roles
  permissions: ['read', 'write', 'delete'], // Permissions
  iat: Math.floor(Date.now() / 1000),       // Issued at
  exp: Math.floor(Date.now() / 1000) + (15 * 60) // Expires in 15 minutes
};

/**
 * Manual JWT generation (since we don't want to install jsonwebtoken package)
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateJWT(payload, secret) {
  // Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Combine all parts
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Generate the token
const token = generateJWT(payload, JWT_SECRET);

console.log('\n========================================');
console.log('🔐 Vextrus ERP - Test JWT Token');
console.log('========================================\n');

console.log('Token Claims:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');

console.log('JWT Token:');
console.log(token);
console.log('\n');

console.log('Copy this for Insomnia Authorization header:');
console.log(`Bearer ${token}`);
console.log('\n');

console.log('Token expires in: 15 minutes');
console.log('Valid for tenant: default');
console.log('\n========================================\n');

// Also save to file for easy access
const fs = require('fs');
fs.writeFileSync('.jwt-token.txt', token, 'utf8');
console.log('✅ Token saved to: .jwt-token.txt\n');
