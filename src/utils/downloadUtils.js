/**
 * Download a single image from URL
 * @param {string} url - Image URL
 * @param {string} filename - Filename for the download
 */
export const downloadSingleImage = async (url, filename) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
};

/**
 * Download multiple images as a zip file
 * @param {Array} photos - Array of photo objects with id and url properties
 * @param {string} zipFilename - Name for the zip file
 */
export const downloadImagesAsZip = async (photos, zipFilename = 'photos.zip') => {
  // Check if JSZip is available or load it dynamically
  let JSZip;
  try {
    JSZip = (await import('jszip')).default;
  } catch (e) {
    // If JSZip isn't available, load it from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);
    
    await new Promise(resolve => {
      script.onload = resolve;
    });
    
    JSZip = window.JSZip;
  }
  
  // Also make sure we have FileSaver
  try {
    const FileSaver = (await import('file-saver')).default;
  } catch (e) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
    document.head.appendChild(script);
    
    await new Promise(resolve => {
      script.onload = resolve;
    });
  }
  
  const saveAs = window.saveAs;
  
  try {
    const zip = new JSZip();
    const photosFolder = zip.folder('photos');
    
    // Create download promises for all photos
    const downloadPromises = photos.map(async (photo) => {
      try {
        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Determine file extension from content type or default to jpg
        let extension = 'jpg';
        if (blob.type === 'image/png') extension = 'png';
        if (blob.type === 'image/gif') extension = 'gif';
        
        // Add to zip with filename
        photosFolder.file(`photo-${photo.id}.${extension}`, blob);
        return true;
      } catch (error) {
        console.error(`Error processing photo ${photo.id}:`, error);
        return false;
      }
    });
    
    // Wait for all downloads to complete
    await Promise.all(downloadPromises);
    
    // Generate and download the zip
    const zipContent = await zip.generateAsync({ type: 'blob' });
    saveAs(zipContent, zipFilename);
  } catch (error) {
    console.error('Error creating zip archive:', error);
  }
}; 