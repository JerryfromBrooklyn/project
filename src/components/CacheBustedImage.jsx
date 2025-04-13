import React from 'react';
import { cacheBustedImage } from '../utils/cacheBuster';

/**
 * Image component with automatic cache busting
 */
function CacheBustedImage(props) {
  const { 
    src, 
    alt = '', 
    forceRefresh = false,
    ...otherProps 
  } = props;
  
  if (!src) return null;
  
  // Apply cache busting to image source
  let finalSrc = cacheBustedImage(src);
  
  // Add timestamp for ultra-fresh content
  if (forceRefresh) {
    finalSrc = `${finalSrc}&t=${Date.now()}`;
  }
  
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      {...otherProps}
    />
  );
}

export default CacheBustedImage; 