import { execSync } from 'child_process';

console.log('🛑 Stopping all Node.js processes...');

try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
  } else {
    // For Unix-like systems
    execSync('pkill -f node || true', { stdio: 'ignore' });
  }
  console.log('✅ All Node.js processes stopped');
} catch (e) {
  console.log('No active Node.js processes found.');
}

console.log('🔄 Now run: npm run restart-dev'); 