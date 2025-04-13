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
2. Photo is marked as "trashed" in the database (user_visibility[userId] = 'TRASH')
3. Photo is removed from normal view but stored in the trash bin
4. User can access the Trash tab in the Dashboard to:
   - View all trashed photos
   - Toggle between "Trashed Uploads" and "Trashed Matches"
   - Restore photos to their original location
   - Permanently hide selected photos

## Implementation Details

### Visibility System (DynamoDB)
The trash system relies on a user-specific visibility map stored in DynamoDB:

```javascript
// Example DynamoDB item structure
{
  "id": "photo-123",
  "user_id": "user-who-uploaded-it",
  "url": "https://...",
  "faces": [...],
  "matched_users": ["user-1", "user-2"],
  "user_visibility": {
    "user-1": "VISIBLE",  // This user sees the photo normally
    "user-2": "TRASH",    // This user has moved it to trash
    "user-3": "HIDDEN"    // This user has permanently hidden it
  }
}
```

The `user_visibility` map allows each user to have their own view of the photo collection.

### Key Methods

#### Moving to Trash
```javascript
// In userVisibilityService.js
export const movePhotosToTrash = async (photoIds, userId) => {
  try {
    // Update DynamoDB item to set user_visibility[userId] = 'TRASH'
    // for each photo in photoIds
    return { success: true };
  } catch (error) {
    console.error('Error moving photos to trash:', error);
    return { success: false, error: error.message };
  }
};
```

#### Restoring from Trash
```javascript
// In userVisibilityService.js
export const restorePhotosFromTrash = async (photoIds, userId) => {
  try {
    // Update DynamoDB item to set user_visibility[userId] = 'VISIBLE'
    // for each photo in photoIds
    return { success: true };
  } catch (error) {
    console.error('Error restoring photos from trash:', error);
    return { success: false, error: error.message };
  }
};
```

#### Permanently Hiding Photos
```javascript
// In userVisibilityService.js
export const permanentlyHidePhotos = async (photoIds, userId) => {
  try {
    // Update DynamoDB item to set user_visibility[userId] = 'HIDDEN'
    // for each photo in photoIds
    return { success: true };
  } catch (error) {
    console.error('Error permanently hiding photos:', error);
    return { success: false, error: error.message };
  }
};
```

### Fetching Photos Based on Visibility

```javascript
// In awsPhotoService.js
export const fetchPhotosByVisibility = async (userId, type, visibility) => {
  try {
    // Fetch photos from DynamoDB where user_visibility[userId] = visibility
    // Filter by type ('uploaded', 'matched', 'all')
    return photos;
  } catch (error) {
    console.error('Error fetching photos by visibility:', error);
    return [];
  }
};
```

### TrashBin Component

The `TrashBin.jsx` component provides the UI for managing trashed photos:

```jsx
// Key functionality in TrashBin.jsx
const [activeView, setActiveView] = useState('uploaded'); // or 'matched'
const [selectedPhotos, setSelectedPhotos] = useState([]);

// Fetch trashed photos when component mounts or view changes
useEffect(() => {
  fetchTrashedPhotos();
}, [userId, activeView]);

// Fetch all photos marked as TRASH for the current user
const fetchTrashedPhotos = async () => {
  const allTrashedPhotos = await awsPhotoService.fetchPhotosByVisibility(
    userId, 
    'all', 
    'TRASH'
  );
  
  // Filter client-side based on the activeView
  if (activeView === 'uploaded') {
    setPhotos(allTrashedPhotos.filter(photo => photo.user_id === userId));
  } else {
    setPhotos(allTrashedPhotos.filter(photo => 
      photo.matched_users?.includes(userId) && photo.user_id !== userId
    ));
  }
};

// Restore selected photos
const handleRestore = async () => {
  const result = await userVisibilityService.restorePhotosFromTrash(
    selectedPhotos, 
    userId
  );
  
  if (result.success) {
    // Update local state and show success message
    const updatedPhotos = photos.filter(
      photo => !selectedPhotos.includes(photo.id)
    );
    setPhotos(updatedPhotos);
    setSelectedPhotos([]);
  } else {
    // Show error message
  }
};

// Permanently hide selected photos
const handleDelete = async () => {
  const result = await userVisibilityService.permanentlyHidePhotos(
    selectedPhotos, 
    userId
  );
  
  if (result.success) {
    // Update local state and show success message
    const updatedPhotos = photos.filter(
      photo => !selectedPhotos.includes(photo.id)
    );
    setPhotos(updatedPhotos);
    setSelectedPhotos([]);
  } else {
    // Show error message
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

1. **Trash Icon**: Consistently represented with the Trash2 icon from Lucide
2. **Confirmation**: No confirmation is required for trash actions (optimistic UI)
3. **Undoing**: Users can restore photos from the TrashBin component
4. **Empty State**: Shows a message when the trash is empty
5. **Selection**: Users can select multiple photos for batch restore/delete actions
6. **Mobile Friendly**: The trash interface works well on both desktop and mobile

## Future Enhancements
- Batch operations directly from PhotoGrid
- Custom retention periods per user
- Trash collection categorization
- Automatic trashs restoration after a set period
- Notifications before automatic permanent deletion
- API for admin to manage all trashed content

---
**Note**: This trash system implementation fully separates data deletion from user visibility, allowing each user to control what they see without affecting other users' experience. 