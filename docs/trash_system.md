# Trash System Documentation

## Overview
The trash system provides a way to temporarily hide photos instead of permanently deleting them. This gives users the ability to recover accidentally deleted photos and provides a safety mechanism before permanent deletion.

## File Dependencies
- `src/components/TrashBin.jsx` - Main trash bin component for viewing and managing trashed photos
- `src/components/PhotoGrid.js` - Reusable grid component used by TrashBin to display photos
- `src/components/PhotoUploader.tsx` - Contains trash functionality for uploaded photos
- `src/services/awsPhotoService.js` - Contains methods for fetching trashed photos
- `src/services/userVisibilityService.js` - Manages photo visibility status (VISIBLE, TRASH, HIDDEN)
- `src/context/AuthContext.jsx` - Context provider for user authentication

## Functionality
1. **Soft Delete**: Photos are marked as "trashed" in the database but not physically deleted
2. **Temporary Storage**: Trashed photos are stored for a configurable period (default: 30 days)
3. **Recovery**: Users can restore photos from trash to their original collections
4. **Permanent Deletion**: Photos can be permanently deleted from the trash
5. **Automatic Cleanup**: Photos exceeding the retention period are automatically deleted
6. **Visibility Control**: Each user has individual control over which photos they see or trash

## User Interaction Flow
1. User can move a photo to trash in two ways:
   - From the PhotoGrid (clicking the trash icon on the photo card)
   - From the Image Viewer modal (clicking the trash/hide button in the top control bar)
2. Photo is marked as "trashed" in the database (visibility status = 'TRASH')
3. Photo is removed from normal view but stored in the trash bin
4. User can access the Trash tab in the Dashboard to:
   - View all trashed photos
   - Toggle between "All Photos", "Trashed Uploads" and "Trashed Matches"
   - Restore photos to their original location
   - Permanently hide selected photos

## Implementation Details

### Visibility System (DynamoDB)
The trash system uses a dedicated visibility table in DynamoDB that maps user-photo relationships to visibility states:

```javascript
// Example DynamoDB item structure in shmong-user-photo-visibility table
{
  "userId": { "S": "user-123" },
  "photoId": { "S": "photo-456" },
  "status": { "S": "TRASH" },
  "updatedAt": { "S": "2025-04-16T06:55:20.683Z" }
}
```

This design allows each user to have their own visibility settings for any photo in the system.

### File Extension Requirements

When working with React components, file extensions are important for proper parsing by the Vite build system:

- Use `.jsx` extension for JavaScript files containing JSX syntax
- Use `.tsx` extension for TypeScript files containing JSX syntax
- Use `.js` extension only for standard JavaScript without JSX

For example:
- `TrashBin.jsx` - Component with JSX syntax
- `SimplePhotoInfoModal.jsx` - Modal component with JSX
- `userVisibilityService.js` - Service with standard JavaScript

Using incorrect extensions (like `.js` for JSX components) will cause parsing errors.

### Key Methods

#### Moving to Trash
```javascript
// In userVisibilityService.js
export const movePhotosToTrash = async (userId, photoIds) => {
  try {
    return await updatePhotoVisibility(userId, photoIds, "TRASH");
  } catch (error) {
    console.error('Error moving photos to trash:', error);
    return { success: false, error: error.message };
  }
};
```

#### Restoring from Trash
```javascript
// In userVisibilityService.js
export const restorePhotosFromTrash = async (userId, photoIds) => {
  return updatePhotoVisibility(userId, photoIds, "VISIBLE");
};
```

#### Permanently Hiding Photos
```javascript
// In userVisibilityService.js
export const permanentlyHidePhotos = async (userId, photoIds) => {
  try {
    return await updatePhotoVisibility(userId, photoIds, "HIDDEN");
  } catch (error) {
    console.error('Error permanently hiding photos:', error);
    return { success: false, error: error.message };
  }
};
```

### Fetching Photos Based on Visibility

```javascript
// In awsPhotoService.js
export const getTrashedPhotos = async (userId) => {
  try {
    // Step 1: Get the visibility map to find photos with TRASH status
    const { visibilityMap } = await getPhotoVisibilityMap(userId);
    
    // Step 2: Filter for TRASH items
    const trashItemIds = Object.entries(visibilityMap)
      .filter(([_, status]) => status === 'TRASH')
      .map(([photoId]) => photoId);
    
    // Step 3: Directly fetch the photos using their IDs
    let allPhotos = [];
    
    // Process in batches of 10 for better performance
    for (let i = 0; i < trashItemIds.length; i += 10) {
      const batch = trashItemIds.slice(i, i + 10);
      const photoPromises = batch.map(photoId => 
        awsPhotoService.getPhotoById(photoId)
      );
      
      const batchResults = await Promise.all(photoPromises);
      const validPhotos = batchResults.filter(Boolean); // Remove null results
      allPhotos = [...allPhotos, ...validPhotos];
    }
    
    return allPhotos;
  } catch (error) {
    console.error('Error fetching trashed photos:', error);
    return [];
  }
};
```

### TrashBin Component

The `TrashBin.jsx` component provides the UI for managing trashed photos:

```jsx
// Key functionality in TrashBin.jsx
const [activeTrashView, setActiveTrashView] = useState('all'); // Default to showing all photos
const [selectedPhotos, setSelectedPhotos] = useState([]);

// Fetch trashed photos when component mounts
useEffect(() => {
  if (userId) {
    loadTrashedPhotos();
  }
}, [userId]);

// Load trash photos directly from visibility map
const loadTrashedPhotos = async () => {
  // Use getTrashedPhotos which properly fetches photos with TRASH visibility status
  const photos = await awsPhotoService.getTrashedPhotos(userId);
  setAllTrashedPhotos(photos || []);
};

// Filter photos based on view type (all, uploaded, matched)
const filteredTrashedPhotos = useMemo(() => {
  if (activeTrashView === 'uploaded') {
    return allTrashedPhotos.filter(photo => photo.user_id === userId || photo.uploaded_by === userId);
  } else if (activeTrashView === 'matched') {
    return allTrashedPhotos.filter(photo => photo.user_id !== userId && photo.uploaded_by !== userId);
  } else {
    return allTrashedPhotos;
  }
}, [allTrashedPhotos, activeTrashView, userId]);

// Restore selected photos
const handleRestorePhotos = async () => {
  if (!selectedPhotos.length) return;
  try {
    const result = await restorePhotosFromTrash(userId, selectedPhotos);
    if (result.success) {
      setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
      setSelectedPhotos([]);
    } else {
      setError(`Failed to restore photos: ${result.error}`);
    }
  } catch (err) {
    console.error('Error restoring photos:', err);
    setError('Failed to restore photos. Please try again later.');
  }
};

// Permanently hide selected photos
const handlePermanentlyHide = async () => {
  if (!selectedPhotos.length) return;
  const confirmed = window.confirm(
    "Are you sure you want to permanently hide these photos? " +
    "They will no longer appear in your account, but will still be available for matching and other users."
  );
  if (!confirmed) return;
  try {
    const result = await permanentlyHidePhotos(userId, selectedPhotos);
    if (result.success) {
      setAllTrashedPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
      setSelectedPhotos([]);
    } else {
      setError(`Failed to permanently hide photos: ${result.error}`);
    }
  } catch (err) {
    console.error('Error permanently hiding photos:', err);
    setError('Failed to permanently hide photos. Please try again later.');
  }
};
```

### Integration with PhotoUploader and PhotoViewer

The trash functionality is integrated into the image viewer in `PhotoUploader.tsx`:

```jsx
// In PhotoUploader.tsx - Image Viewer
<button
  onClick={(e) => {
    e.stopPropagation();
    handleTrash(viewerImage);
    setViewerImage(null);
  }}
  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
  aria-label="Hide image"
>
  <Trash2 className="w-5 h-5" />
</button>
```

And the `handleTrash` function:

```javascript
// In PhotoUploader.tsx
const handleTrash = async (upload: UploadItem) => {
  try {
    if (!upload.photoId) {
      // Just remove from local state if not saved to backend yet
      removeUpload(upload.id);
      return;
    }
    
    // Call API to move to trash
    const result = await awsPhotoService.trashPhoto(upload.photoId);
    
    if (result.success) {
      // Remove from local state
      removeUpload(upload.id);
      // Close any open viewers/modals
      if (viewerImage?.id === upload.id) setViewerImage(null);
      if (selectedUpload?.id === upload.id) setSelectedUpload(null);
    } else {
      throw new Error(result.error || 'Failed to move to trash');
    }
  } catch (error) {
    onError?.((error as Error).message);
  }
};
```

## Configuration Options
- `TRASH_RETENTION_DAYS`: Number of days photos remain in trash before automatic deletion (default: 30)
- `TRASH_AUTO_DELETE`: Boolean to enable/disable automatic deletion (default: true)

## User Experience

1. **Trash View Options**: Users can toggle between "All Photos", "Matched Photos", and "My Uploads" in the trash bin
2. **Default View**: Trash bin defaults to showing "All Photos" to ensure users see everything in their trash
3. **Refresh Button**: Users can manually refresh the trash bin contents
4. **Empty State**: Shows a message when the trash is empty
5. **Selection**: Users can select multiple photos for batch restore/delete actions
6. **Mobile Friendly**: The trash interface works well on both desktop and mobile

## Performance Considerations

1. **Direct Query Approach**: The trash system uses direct queries to the visibility map and specific photo IDs rather than scanning the entire photo database
2. **Pagination Safety**: A maximum page limit prevents infinite pagination loops
3. **Batch Processing**: Photos are fetched in batches of 10 to optimize performance
4. **Limit Per Page**: Database queries use a limit parameter to reduce strain on DynamoDB

## Future Enhancements
- Batch operations directly from PhotoGrid
- Custom retention periods per user
- Trash collection categorization
- Automatic trash restoration after a set period
- Notifications before automatic permanent deletion
- API for admin to manage all trashed content

---
**Note**: This trash system implementation fully separates data deletion from user visibility, allowing each user to control what they see without affecting other users' experience. 