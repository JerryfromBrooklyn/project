const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Generate timestamp
const buildTime = new Date().toISOString();

// Set environment variables for Vite
// Vite expects env vars prefixed with VITE_
process.env.VITE_BUILD_TIME = buildTime;
process.env.VITE_BUILD_NUMBER = version;

console.log(`Set VITE_BUILD_TIME=${buildTime}`);
console.log(`Set VITE_BUILD_NUMBER=${version}`);

// We don't actually need to output anything here for cross-env
// The main purpose is to set process.env for the subsequent command 