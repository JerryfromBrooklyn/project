import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🔄 Starting reset process...');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Clear cache
  console.log('🧹 Clearing Vite cache...');
  const cacheDirs = [
    path.join(__dirname, '..', 'node_modules', '.vite'),
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, '..', '.cache')
  ];
  
  cacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        execSync(`rimraf "${dir}"`, { stdio: 'inherit' });
      }
    } catch (e) {
      console.log(`Could not remove ${dir}: ${e.message}`);
    }
  });

  // Create a restart script that will be executed after this one exits
  const restartScript = `
setTimeout(() => {
  const { spawn } = require('child_process');
  
  try {
    console.log('🔨 Building application...');
    const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    
    buildProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Build process failed with code ' + code);
        return;
      }
      
      console.log('✅ Build completed successfully!');
      console.log('🚀 Starting dev server...');
      
      // Start dev server and capture URL
      const devProcess = spawn('npm', ['run', 'dev'], { 
        shell: true,
        stdio: ['inherit', 'pipe', 'inherit'] 
      });
      
      // Parse output to find and highlight URL
      devProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        const urlMatch = output.match(/https?:\\/\\/localhost:\\d+/);
        if (urlMatch) {
          const url = urlMatch[0];
          console.log('\\n');
          console.log('==============================================');
          console.log('🌐 APPLICATION RUNNING AT: ' + url);
          console.log('==============================================');
          console.log('\\n');
        }
      });
      
      devProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Dev server process exited with code ' + code);
        }
      });
    });
  } catch (error) {
    console.error('❌ Restart process failed:', error.message);
    process.exit(1);
  }
}, 1000);
  `;

  // Write the restart script to a temporary file
  const restartScriptPath = path.join(__dirname, 'temp-restart.cjs');
  fs.writeFileSync(restartScriptPath, restartScript);

  console.log('🛑 Stopping all Node.js processes...');
  console.log('⏳ The application will rebuild and restart automatically...');
  
  // Execute the restart script in a detached process, then kill this process
  if (process.platform === 'win32') {
    execSync(`start cmd /c "node ${restartScriptPath}"`, { 
      stdio: 'ignore',
      windowsHide: false,
      detached: true
    });
    
    // Kill all Node processes except the new one we just started
    execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
  } else {
    // For Unix-like systems
    execSync(`nohup node ${restartScriptPath} > reset.log 2>&1 &`, { 
      stdio: 'ignore',
      detached: true
    });
    execSync('pkill -f node || true', { stdio: 'ignore' });
  }
  
} catch (error) {
  console.error('❌ Reset process failed:', error.message);
  process.exit(1);
} 