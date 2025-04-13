const fs = require('fs');
const path = require('path');

// Generate timestamp in format YYYYMMDDHHMMSS
const now = new Date();
const timestamp = 
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0') +
  now.getSeconds().toString().padStart(2, '0');

// Create build-info.js file
const buildInfoPath = path.join(__dirname, '..', 'src', 'utils', 'build-info.js');
const buildInfoContent = `// Auto-generated timestamp
export const BUILD_TIMESTAMP = "${timestamp}";
export const APP_VERSION = "1.0.0";
`;

// Write file
fs.writeFileSync(buildInfoPath, buildInfoContent);

console.log(`Build info generated with timestamp ${timestamp}`);
