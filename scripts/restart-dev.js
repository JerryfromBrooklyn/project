import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🔄 Starting dev server restart process...');

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

  // Build
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
  
  // Create a script to run banner diagnostics
  const bannerCheckScript = `
  setTimeout(() => {
    console.log('\\n🔍 Running banner visibility check...');
    if (window.diagnoseBannerIssues) {
      window.diagnoseBannerIssues();
    } else {
      console.log('❌ Banner diagnostic tool not available');
    }
  }, 5000);
  `;
  
  // Write banner check script to a file
  const bannerCheckPath = path.join(__dirname, 'banner-check.js');
  fs.writeFileSync(bannerCheckPath, bannerCheckScript);
  
  // Start dev server with URL capture
  console.log('🚀 Starting dev server...');
  
  // Use spawn instead of execSync to capture output
  const devProcess = spawn('npm', ['run', 'dev'], { 
    shell: true,
    stdio: ['inherit', 'pipe', 'inherit']
  });
  
  let serverUrl = '';
  
  // Function to extract URL from server output
  const extractUrl = (data) => {
    const output = data.toString();
    console.log(output); // Show standard output
    
    // Look for localhost URL in the output
    const urlMatch = output.match(/http:\/\/localhost:\d+/);
    if (urlMatch && !serverUrl) {
      serverUrl = urlMatch[0];
      // Display URL prominently
      console.log('\n');
      console.log('==============================================');
      console.log(`🌐 APPLICATION RUNNING AT: ${serverUrl}`);
      console.log('==============================================');
      console.log('\n');
      
      // After server starts, schedule banner diagnostic check
      console.log('⏱️ Banner visibility check will run in 5 seconds...');
    }
  };
  
  // Capture and process server output
  devProcess.stdout.on('data', extractUrl);
  
  // Handle server process exit
  devProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Dev server process exited with code ${code}`);
    }
  });
  
} catch (error) {
  console.error('❌ Restart process failed:', error.message);
  process.exit(1);
} 