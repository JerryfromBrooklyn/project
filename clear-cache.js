const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to clean
const directoriesToClean = [
  '.vite_cache',
  'node_modules/.vite',
  'node_modules/.cache',
  'dist'
];

// Clean directories
console.log('🧹 Cleaning cache directories...');
directoriesToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  
  try {
    if (fs.existsSync(fullPath)) {
      console.log(`Removing ${fullPath}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Error removing ${fullPath}:`, error.message);
  }
});

// Clear browser cache via command
console.log('🔄 Restarting Vite with clean cache...');
try {
  // Stop any running Vite processes
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  } catch (error) {
    // It's okay if this fails
  }
  
  // Start dev server with the VITE_FORCE_RELOAD environment variable
  execSync('npm run dev', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      VITE_FORCE_OPTIMIZEDEPS: 'true',
      VITE_FORCE_RELOAD: 'true' 
    } 
  });
} catch (error) {
  console.error('Failed to restart Vite:', error.message);
} 