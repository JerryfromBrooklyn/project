
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
        
        const urlMatch = output.match(/https?:\/\/localhost:\d+/);
        if (urlMatch) {
          const url = urlMatch[0];
          console.log('\n');
          console.log('==============================================');
          console.log('🌐 APPLICATION RUNNING AT: ' + url);
          console.log('==============================================');
          console.log('\n');
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
  