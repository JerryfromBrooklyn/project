/**
 * Version and cache-control utilities
 */

import { checkForNewVersion } from './cacheBuster';

// Get version from environment variables (set during build)
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now().toString();

// Local storage key for version checks
const VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'version_last_check';

/**
 * Saves the current version to local storage
 */
export const saveCurrentVersion = () => {
  try {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to save version to localStorage', e);
  }
};

/**
 * Gets the previously saved version from local storage
 * @returns {string|null} The saved version or null if not found
 */
export const getSavedVersion = () => {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch (e) {
    console.error('Failed to get version from localStorage', e);
    return null;
  }
};

/**
 * Checks if the app version has changed and prompts for reload if needed
 */
export const checkVersion = async () => {
  const savedVersion = getSavedVersion();
  
  if (savedVersion && savedVersion !== APP_VERSION) {
    // Version changed, prompt for reload
    checkForNewVersion(savedVersion, APP_VERSION);
  }
  
  // Always save current version after check
  saveCurrentVersion();
};

/**
 * Checks if we should fetch the latest version from the server
 * @param {number} intervalMs - Milliseconds between checks
 * @returns {boolean} Whether we should check for a new version
 */
export const shouldCheckVersion = (intervalMs = 3600000) => { // Default: check once per hour
  try {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    
    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();
    
    return (now - lastCheckTime) > intervalMs;
  } catch (e) {
    return true;
  }
};

/**
 * Fetches the latest version from the server
 * @returns {Promise<string>} The latest version
 */
export const fetchLatestVersion = async () => {
  try {
    // Add timestamp to ensure the request isn't cached
    const response = await fetch(`/api/version?t=${Date.now()}`);
    const data = await response.json();
    return data.version;
  } catch (e) {
    console.error('Failed to fetch latest version', e);
    return null;
  }
};

/**
 * Checks for a new version on the server and prompts for reload if needed
 */
export const checkForUpdates = async () => {
  if (!shouldCheckVersion()) return;
  
  const latestVersion = await fetchLatestVersion();
  if (latestVersion) {
    checkForNewVersion(APP_VERSION, latestVersion);
    saveCurrentVersion();
  }
};

// Export default object with all utilities
export default {
  APP_VERSION,
  BUILD_TIMESTAMP,
  checkVersion,
  checkForUpdates,
  saveCurrentVersion,
  getSavedVersion
};
