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

try {
  // Read the current version file
  let versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
  
  // Extract current build number using regex
  const buildNumberRegex = /const BUILD_NUMBER = ['"](\d+)['"];/;
  const match = versionFileContent.match(buildNumberRegex);
  
  if (match && match[1]) {
    // Increment build number
    const currentBuildNumber = parseInt(match[1], 10);
    const newBuildNumber = (currentBuildNumber + 1).toString().padStart(3, '0');
    
    console.log(`Incrementing build number from ${match[1]} to ${newBuildNumber}`);
    
    // Replace build number in the file
    versionFileContent = versionFileContent.replace(
      buildNumberRegex, 
      `const BUILD_NUMBER = '${newBuildNumber}';`
    );
    
    // Write updated content back to the file
    fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');
    
    console.log('Build number incremented successfully!');
  } else {
    console.error('Could not find build number in version file.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error updating build number:', error);
  process.exit(1);
} 