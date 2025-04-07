// Debug utility for banner visibility issues

// Function to check if an element is visible
const isVisible = (element) => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (style.opacity === '0') return false;
  
  const rect = element.getBoundingClientRect();
  // Check if it has zero size
  if (rect.width === 0 || rect.height === 0) return false;
  
  // Check if it's outside viewport
  if (rect.right < 0 || rect.bottom < 0 || 
      rect.left > window.innerWidth || 
      rect.top > window.innerHeight) return false;
  
  return true;
};

// Function to check for elements with higher z-index
const findElementsWithHigherZIndex = (targetZIndex) => {
  const allElements = document.querySelectorAll('*');
  const elementsWithHigherZIndex = [];
  
  allElements.forEach(element => {
    const style = window.getComputedStyle(element);
    const zIndex = parseInt(style.zIndex);
    
    if (!isNaN(zIndex) && zIndex > targetZIndex) {
      elementsWithHigherZIndex.push({
        element,
        zIndex,
        tag: element.tagName,
        classes: element.className,
        id: element.id
      });
    }
  });
  
  return elementsWithHigherZIndex;
};

// Function to force inject a banner as a last resort
const forceInjectBanner = () => {
  console.log('[BANNER DEBUG] Force injecting a banner as a last resort');
  const banner = document.createElement('div');
  banner.id = 'force-injected-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: red;
    color: white;
    text-align: center;
    padding: 4px;
    z-index: 999999;
    font-size: 12px;
    font-weight: bold;
    height: 22px;
  `;
  banner.innerText = `FORCED BANNER: VERSION 1.0.0.${new Date().getTime().toString().substring(7)} (${new Date().toLocaleString()})`;
  document.body.insertBefore(banner, document.body.firstChild);
  return banner;
};

// Function to diagnose banner issues
export const diagnoseBannerIssues = () => {
  try {
    console.log('[BANNER DEBUG] Starting banner diagnosis...');
    
    // Check for different possible banner selectors
    const bannerSelectors = [
      '.fixed.top-0.left-0.right-0',
      '#force-banner',
      '#test-banner-element',
      '[role="status"]',
      'div[style*="position: fixed"][style*="top: 0"]'
    ];
    
    let banner = null;
    for (const selector of bannerSelectors) {
      banner = document.querySelector(selector);
      if (banner) {
        console.log(`[BANNER DEBUG] Found banner using selector: ${selector}`);
        break;
      }
    }
    
    if (!banner) {
      console.error('[BANNER DEBUG] Banner element not found in DOM using any selector');
      console.log('[BANNER DEBUG] Available top-level elements:', Array.from(document.body.children).map(el => ({
        tag: el.tagName,
        id: el.id,
        classes: el.className
      })));
      
      banner = forceInjectBanner();
      return;
    }
    
    console.log('[BANNER DEBUG] Banner element found in DOM:', banner);
    
    // Check if banner is visible
    const bannerVisible = isVisible(banner);
    console.log('[BANNER DEBUG] Banner visibility check result:', bannerVisible);
    
    // Get computed styles
    const style = window.getComputedStyle(banner);
    console.log('[BANNER DEBUG] Banner computed styles:', {
      zIndex: style.zIndex,
      position: style.position,
      top: style.top,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      height: style.height,
      width: style.width,
      backgroundColor: style.backgroundColor,
      color: style.color
    });
    
    // Check for elements with higher z-index
    const bannerZIndex = parseInt(style.zIndex) || 0;
    const higherZIndexElements = findElementsWithHigherZIndex(bannerZIndex);
    if (higherZIndexElements.length > 0) {
      console.log('[BANNER DEBUG] Elements with higher z-index that might be overlapping:', higherZIndexElements);
    } else {
      console.log('[BANNER DEBUG] No elements found with higher z-index');
    }
    
    // Check banner position in DOM hierarchy
    let parent = banner.parentElement;
    const parentChain = [];
    while (parent) {
      parentChain.push({
        tag: parent.tagName,
        id: parent.id,
        classes: parent.className
      });
      parent = parent.parentElement;
    }
    console.log('[BANNER DEBUG] Banner parent hierarchy:', parentChain);
    
    // Force banner to be visible
    console.log('[BANNER DEBUG] Attempting to force banner visibility...');
    banner.style.zIndex = '999999';
    banner.style.background = 'red';
    banner.style.color = 'white';
    banner.style.fontWeight = 'bold';
    banner.style.display = 'flex';
    banner.style.visibility = 'visible';
    banner.style.opacity = '1';
    
    console.log('[BANNER DEBUG] Diagnosis complete');
  } catch (error) {
    console.error('[BANNER DEBUG] Error during diagnosis:', error);
    forceInjectBanner();
  }
};

// Attach to window for convenient debugging in console
if (typeof window !== 'undefined') {
  window.diagnoseBannerIssues = diagnoseBannerIssues;
  console.log('[BANNER DEBUG] Debug utilities attached to window object. Use window.diagnoseBannerIssues() to diagnose banner issues.');
  
  // Auto-run diagnostics after a short delay
  setTimeout(diagnoseBannerIssues, 3000);
}

export default {
  diagnoseBannerIssues
}; 