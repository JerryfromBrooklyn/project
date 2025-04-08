/**
 * Version utility to track build information
 */
// Base version number - update this manually when making significant changes
export const VERSION = '1.0.0';
// Build number increments automatically with each build
const BUILD_NUMBER = '125';
// Get current date and time
const now = new Date();
const buildDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
// Format time as regular time with AM/PM
const formatRegularTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes}:${seconds} ${ampm}`;
};
const buildTime = formatRegularTime(now);
// Format: VERSION.BUILD_NUMBER (YYYY-MM-DD HH:MM:SS AM/PM)
export const fullVersion = `${VERSION}.${BUILD_NUMBER} (${buildDate} ${buildTime})`;
/**
 * Log version information to console
 */
export const logVersion = () => {
    const versionInfo = `
=================================================
🚀 APPLICATION VERSION: ${fullVersion}
=================================================
  `;
    console.log(versionInfo);
    // Expose version to window for other components to use
    if (typeof window !== 'undefined') {
        window.__APP_VERSION__ = fullVersion;
    }
    return fullVersion;
};
export default {
    VERSION,
    fullVersion,
    logVersion
};
