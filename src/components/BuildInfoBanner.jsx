import React, { useEffect } from 'react';

const BuildInfoBanner = () => {
  // Log right at the start
  console.log('[BuildInfoBanner] EXECUTION TEST - Component function started');

  // Original logic restored
  const buildTime = import.meta.env.VITE_BUILD_TIME;
  const buildVersion = import.meta.env.VITE_BUILD_NUMBER;
  const isDevelopment = import.meta.env.MODE === 'development';

  let bannerText = '';

  if (isDevelopment) {
    bannerText = `Development Mode - Last Refresh: ${new Date().toLocaleTimeString()}`;
  } else {
    const formattedBuildTime = buildTime
      ? new Date(buildTime).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })
      : 'N/A';
    bannerText = `Build v${buildVersion || 'N/A'} - Deployed: ${formattedBuildTime}`;
  }

  // Log before return
  console.log('[BuildInfoBanner] Rendering with text:', bannerText);

  // useEffect to log after mount
  useEffect(() => {
    console.log('[BuildInfoBanner] EFFECT TEST - Component mounted');
  }, []); // Empty dependency array means it runs only once after mount

  return (
    <div
      className={isDevelopment
        ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 text-xs text-center py-1 px-2 fixed top-0 left-0 right-0 z-[9999] shadow"
        : "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 text-xs text-center py-1 px-2 fixed top-0 left-0 right-0 z-[9999] shadow"
      }
      role="status"
      aria-live={isDevelopment ? 'off' : 'polite'}
    >
      {bannerText}
    </div>
  );
};

export default BuildInfoBanner; 