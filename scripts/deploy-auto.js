#!/usr/bin/env node

/**
 * Cross-platform deployment script
 * Automatically determines OS and runs appropriate deployment command
 */

import { execSync } from 'child_process';
import os from 'os';

console.log('=================================================');
console.log('🚀 STARTING AUTOMATED BUILD AND DEPLOYMENT PROCESS');
console.log('=================================================');

try {
  // Determine platform
  const platform = os.platform();
  console.log(`📋 Detected platform: ${platform}`);

  let deploymentCommand;
  
  // Choose the appropriate deployment command based on platform
  if (platform === 'win32') {
    console.log('🪟 Using Windows deployment script...');
    deploymentCommand = 'npm run deploy:win';
  } else {
    // For Unix-like systems (Linux, macOS)
    console.log('🐧 Using Unix deployment script...');
    deploymentCommand = 'npm run deploy';
  }
  
  // Execute the deployment with proper error checking
  try {
    execSync(deploymentCommand, { stdio: 'inherit' });
    
    // If we get here, the deployment was successful
    console.log('=================================================');
    console.log('✅ AUTO-DEPLOYMENT COMPLETED SUCCESSFULLY');
    console.log('=================================================');
  } catch (deployError) {
    // The deployment script failed
    console.error('=================================================');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('=================================================');
    console.error(`Error executing ${deploymentCommand}:`);
    console.error(deployError.message);
    process.exit(1);
  }
} catch (error) {
  console.error('=================================================');
  console.error('❌ AUTO-DEPLOYMENT SETUP FAILED');
  console.error('=================================================');
  console.error(error.message);
  process.exit(1);
} 