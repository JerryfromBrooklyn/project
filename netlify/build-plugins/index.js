/**
 * Netlify Build Plugin: Ensure Vite Installation
 * 
 * This plugin ensures Vite is properly installed before the build process starts.
 * It checks if Vite is installed and if not, installs it globally.
 */

const { execSync } = require('child_process');

module.exports = {
  onPreBuild: ({ utils }) => {
    try {
      // Check if vite is installed and accessible
      execSync('npx vite --version', { stdio: 'pipe' });
      console.log('✅ Vite is installed and accessible');
    } catch (error) {
      console.log('⚠️ Vite is not installed or not accessible');
      
      try {
        // Install vite locally in the project
        console.log('Installing vite and related packages...');
        execSync('npm install --no-save vite@6.2.5 @vitejs/plugin-react@4.3.4 vite-plugin-node-polyfills@0.23.0', { stdio: 'inherit' });
        console.log('✅ Vite installed successfully');
      } catch (installError) {
        // Log error and fail the build
        utils.build.failBuild('Failed to install Vite: ' + installError.message);
      }
    }
  }
}; 