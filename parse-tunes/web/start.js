#!/usr/bin/env node

// Startup script for Parse-Tunes Web Demo
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Parse-Tunes Web Demo...\n');

// Start the server
const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`\n📱 Server stopped with code ${code}`);
    process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGTERM');
});