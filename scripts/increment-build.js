/**
 * Script to automatically increment the build number before each build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to version file
const versionFilePath = path.join(__dirname, '..', 'src', 'utils', 'version.ts');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  // Read the current version file
  let versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
  
  // Extract current build number using regex
  const buildNumberRegex = /const BUILD_NUMBER = ['"](\d+)['"];/;
  const match = versionFileContent.match(buildNumberRegex);
  
  if (match && match[1]) {
    // Increment build number
    const currentBuildNumber = parseInt(match[1], 10);
    const newBuildNumber = (currentBuildNumber + 1).toString();
    
    console.log(`Incrementing build number from ${match[1]} to ${newBuildNumber}`);
    
    // Replace build number in the file
    versionFileContent = versionFileContent.replace(
      buildNumberRegex, 
      `const BUILD_NUMBER = '${newBuildNumber}';`
    );
    
    // Write updated content back to the file
    fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');
    
    console.log('Build number incremented successfully!');
    
    // Make a copy of the current build info for reference
    const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
    
    // Read package.json for version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const buildInfo = {
      version: packageJson.version,
      buildNumber: newBuildNumber,
      buildDate: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2), 'utf8');
    console.log('Build info saved to build-info.json');
    
  } else {
    console.error('Could not find build number in version file.');
    // For debugging
    console.log('Version file content:', versionFileContent);
    process.exit(1);
  }
} catch (error) {
  console.error('Error updating build number:', error);
  process.exit(1);
} 