// Script to kill lingering Node.js processes
// This is cross-platform and works on both Windows and Unix-based systems

import { exec } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

// Command to list and kill Node.js processes based on OS
const cmd = isWindows
  ? 'taskkill /F /IM node.exe'
  : "pkill -f 'node|vite'";

console.log(`Attempting to kill lingering Node processes...`);

exec(cmd, (error) => {
  // We ignore errors since they simply mean no matching processes were found
  if (!error) {
    console.log('Successfully terminated Node processes');
  } else {
    console.log('No lingering Node processes found');
  }
});

// For Windows, also attempt to kill any processes using the Vite ports
if (isWindows) {
  // Common Vite ports
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 9000];
  
  ports.forEach(port => {
    const portCmd = `for /f "tokens=5" %p in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %p`;
    exec(portCmd, () => {
      // Ignore errors, just a best effort to free ports
    });
  });
}

// Small delay to ensure processes are killed before proceeding
setTimeout(() => {
  console.log('Continuing with server startup...');
}, 1000); 