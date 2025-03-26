// Windows PowerShell script to kill processes on development ports
import { exec } from 'child_process';

const ports = [5173, 5174, 5175, 3000, 8080, 4173];

console.log('Looking for processes using development ports...');

ports.forEach(port => {
  const command = `Get-Process -Id (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue`;
  
  exec(`powershell -Command "${command}"`, (error, stdout, stderr) => {
    if (!error && !stderr) {
      console.log(`✓ Port ${port} freed successfully`);
    } else {
      console.log(`○ No process found on port ${port}`);
    }
  });
});

console.log('Port cleanup completed. You can now start the development server.'); 