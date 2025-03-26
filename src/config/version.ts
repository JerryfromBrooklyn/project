export const APP_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: '2024.03.20',
  getVersionString: () => `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch} (${APP_VERSION.build})`
};

// Instructions for updating version:
// 1. Increment the appropriate version number:
//    - major: Breaking changes
//    - minor: New features
//    - patch: Bug fixes
// 2. Update the build date to current date
// 3. Add a comment below with the changes made
// 4. Commit with message: "chore: bump version to X.Y.Z"

// Version History:
// v1.0.0 (2024.03.20) - Initial release with face recognition and photo management 