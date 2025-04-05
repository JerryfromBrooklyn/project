import { useState, useCallback, useEffect } from 'react';
import VirtualizedList from './VirtualizedList';

/**
 * LargeDataTable - Example component for efficiently rendering large datasets
 * with pagination, virtualization, and optimization techniques.
 * 
 * @param {Object} props
 * @param {Array} props.data - The data array (can be very large)
 * @param {Function} props.fetchData - Function to fetch more data (for infinite scroll)
 * @param {Function} props.renderItem - Optional custom render function
 * @param {number} props.initialLimit - Initial number of items to show
 * @param {Function} props.itemProcessor - Function to process each item before display (for heavy calculations)
 * @param {string} props.className - Additional CSS classes
 */
const LargeDataTable = ({
  data = [],
  fetchData = null,
  renderItem = null,
  initialLimit = 50,
  itemProcessor = item => item,
  className = ''
}) => {
  const [displayData, setDisplayData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Memoize expensive item processing
  const processedItems = useCallback(() => {
    // Process in batches to avoid UI freeze
    const processItemBatch = (batchData, startIdx, batchSize, callback) => {
      let result = [];
      
      const end = Math.min(startIdx + batchSize, batchData.length);
      
      for (let i = startIdx; i < end; i++) {
        result.push(itemProcessor(batchData[i]));
      }
      
      if (end < batchData.length) {
        // Schedule next batch
        setTimeout(() => {
          const nextBatch = processItemBatch(batchData, end, batchSize, callback);
          callback([...result, ...nextBatch]);
        }, 0);
      } else {
        callback(result);
      }
      
      return result;
    };
    
    // Start processing first batch
    return processItemBatch(data.slice(0, initialLimit), 0, 50, processedItems => {
      setDisplayData(processedItems);
    });
  }, [data, initialLimit, itemProcessor]);
  
  // Initialize with processed data
  useEffect(() => {
    processedItems();
  }, [processedItems]);
  
  // Default render function if none provided
  const defaultRenderItem = (item, index) => (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50">
      <h3 className="font-medium">Item {index + 1}</h3>
      <pre className="text-sm text-gray-600 mt-1 overflow-hidden text-ellipsis">
        {JSON.stringify(item, null, 2)}
      </pre>
    </div>
  );
  
  // Load more data function for infinite scroll
  const loadMore = useCallback(async () => {
    if (!fetchData || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const nextPage = page + 1;
      const newData = await fetchData(nextPage);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setPage(nextPage);
        setDisplayData(prev => [...prev, ...newData.map(itemProcessor)]);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, isLoading, page, itemProcessor]);
  
  return (
    <div className={`large-data-container ${className}`}>
      <div className="mb-4 text-sm text-gray-500">
        Displaying {displayData.length} of {data.length} items
      </div>
      
      <div className="virtualized-container h-[600px] border border-gray-200 rounded-lg">
        <VirtualizedList
          items={displayData}
          renderItem={renderItem || defaultRenderItem}
          itemHeight={100} // Adjust based on your average item height
          overscan={10}
          infiniteScroll={!!fetchData}
          loadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          loadingMessage="Loading more data..."
          batchSize={50}
        />
      </div>
    </div>
  );
};

export default LargeDataTable; 