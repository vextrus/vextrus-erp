#!/usr/bin/env node
/**
 * Test script to check MCP server availability
 */

const { spawn } = require('child_process');
const path = require('path');

// MCP servers from .mcp.json
const mcpServers = [
  {
    name: 'brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search', '--help'],
  },
  {
    name: 'memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory', '--help'],
  },
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '--help'],
  }
];

console.log('Testing MCP Server Connectivity...\n');

async function testServer(server) {
  return new Promise((resolve) => {
    console.log(`Testing ${server.name}...`);
    
    const child = spawn(server.command, server.args, {
      shell: true,
      timeout: 5000
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${server.name}: Available`);
      } else {
        console.log(`❌ ${server.name}: Not available (exit code: ${code})`);
      }
      resolve();
    });

    child.on('error', (err) => {
      console.log(`❌ ${server.name}: Error - ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  for (const server of mcpServers) {
    await testServer(server);
  }
  console.log('\nTest complete.');
}

main().catch(console.error);