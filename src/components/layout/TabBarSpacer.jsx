import React from 'react';

/**
 * TabBarSpacer component
 * Adds padding at the bottom of pages to prevent content from being hidden behind the fixed TabNavigation
 */
const TabBarSpacer = () => {
  return (
    <div className="h-16 pb-safe w-full" aria-hidden="true" />
  );
};

export default TabBarSpacer; 