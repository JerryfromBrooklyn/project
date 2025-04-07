
setTimeout(() => {
  const { execSync } = require('child_process');
  
  try {
    console.log('🔨 Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('🚀 Starting dev server...');
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Restart process failed:', error.message);
    process.exit(1);
  }
}, 1000);
  