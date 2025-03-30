/**
 * kill-node.js
 * 
 * This script cleans up any lingering Node processes before starting the development server.
 * It helps prevent port conflicts and zombie processes.
 * 
 * For Netlify deployment, this script is not used in production.
 */

import { exec } from 'child_process';
import { platform } from 'os';

// Skip in production (Netlify)
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode, skipping process cleanup');
  process.exit(0);
}

console.log('Cleaning up lingering Node processes...');

// Platform-specific cleanup commands
const isWindows = platform() === 'win32';
const cleanupCommand = isWindows
  ? 'taskkill /F /IM node.exe'
  : "pkill -f 'node|vite'";

// Execute the cleanup command
exec(cleanupCommand, (error, stdout, stderr) => {
  if (error) {
    // Error could mean no processes found, which is fine
    console.log('No lingering Node processes found');
  } else {
    console.log('Successfully terminated Node processes');
    console.log(stdout || stderr);
  }
});

// Also free up common Vite ports on Windows
if (isWindows) {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179];
  
  ports.forEach(port => {
    const portCommand = `for /f "tokens=5" %p in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %p`;
    exec(portCommand, () => {
      // Ignore errors - just best effort
    });
  });
}

// Add a small delay to ensure processes are terminated
setTimeout(() => {
  console.log('Cleanup complete, continuing with development server...');
}, 1000); 