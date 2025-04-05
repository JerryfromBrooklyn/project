import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VirtualizedList - A component that efficiently renders large lists with virtualization
 * and infinite scrolling capabilities to prevent performance issues.
 *
 * @param {Object} props
 * @param {Array} props.items - The full array of items to be rendered
 * @param {Function} props.renderItem - Function to render each item (receives item, index, and isVisible)
 * @param {number} props.itemHeight - Height of each item in pixels (can be fixed or average)
 * @param {number} props.overscan - Number of items to render above/below visible area
 * @param {boolean} props.infiniteScroll - Whether to enable infinite scrolling
 * @param {Function} props.loadMore - Function to call when more items should be loaded
 * @param {boolean} props.hasMore - Whether there are more items to load
 * @param {string} props.loadingMessage - Message to show while loading more items
 * @param {number} props.batchSize - Number of items to render in each batch (default: 50)
 * @param {boolean} props.isLoading - Whether items are currently being loaded
 * @param {string} props.className - Additional CSS class for the container
 */
const VirtualizedList = ({
  items = [],
  renderItem,
  itemHeight = 50,
  overscan = 5,
  infiniteScroll = false,
  loadMore = () => {},
  hasMore = false,
  loadingMessage = 'Loading more items...',
  batchSize = 50,
  isLoading = false,
  className = '',
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: batchSize });
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);
  const totalItems = items.length;
  const totalHeight = totalItems * itemHeight;
  
  // Track rendered items batch to prevent rendering all at once
  const [renderedItemsCount, setRenderedItemsCount] = useState(batchSize);
  
  // Update the visible range when scrolling
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    
    // Calculate which items are visible
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      Math.floor((scrollTop + clientHeight) / itemHeight) + overscan
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
    
    // If we're approaching the bottom and have more items to load
    if (
      infiniteScroll &&
      hasMore &&
      !isLoading &&
      scrollTop + clientHeight > totalHeight - (clientHeight / 2)
    ) {
      loadMore();
    }
  }, [
    itemHeight,
    overscan,
    totalItems,
    infiniteScroll,
    hasMore,
    isLoading,
    totalHeight,
    loadMore,
  ]);
  
  // Gradually render more items for better initial load performance
  useEffect(() => {
    if (renderedItemsCount < totalItems) {
      const timeoutId = setTimeout(() => {
        setRenderedItemsCount(Math.min(renderedItemsCount + batchSize, totalItems));
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [renderedItemsCount, totalItems, batchSize]);
  
  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange);
    
    return () => {
      container.removeEventListener('scroll', updateVisibleRange);
    };
  }, [updateVisibleRange]);
  
  // Handle item count changes
  useEffect(() => {
    updateVisibleRange();
  }, [totalItems, updateVisibleRange]);
  
  // The items that are currently visible based on the scroll position
  const visibleItems = items
    .slice(0, renderedItemsCount)
    .slice(visibleRange.start, visibleRange.end + 1);
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container overflow-auto ${className}`}
      style={{ position: 'relative', height: '100%' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <div
              key={`virtual-item-${actualIndex}`}
              style={{
                position: 'absolute',
                top: `${actualIndex * itemHeight}px`,
                width: '100%',
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(item, actualIndex, true)}
            </div>
          );
        })}
        
        {infiniteScroll && isLoading && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              position: 'absolute',
              bottom: 0,
              width: '100%',
            }}
          >
            {loadingMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedList; 