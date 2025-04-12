# Trash System Documentation

## Overview
The trash system provides a way to temporarily hide photos instead of permanently deleting them. This gives users the ability to recover accidentally deleted photos and provides a safety mechanism before permanent deletion.

## File Dependencies
- `src/components/TrashBin.jsx` - Main trash bin component
- `src/services/FaceIndexingService.jsx` - Handles interaction with AWS Rekognition
- `src/services/PhotoManagementService.js` - Manages photo operations
- `src/context/TrashContext.jsx` - Context provider for trash state management
- `src/hooks/useTrash.js` - Custom hook for trash operations

## Functionality
1. **Soft Delete**: Photos are marked as "trashed" in the database but not physically deleted
2. **Temporary Storage**: Trashed photos are stored for a configurable period (default: 30 days)
3. **Recovery**: Users can restore photos from trash to their original collections
4. **Permanent Deletion**: Photos can be permanently deleted from the trash
5. **Automatic Cleanup**: Photos exceeding the retention period are automatically deleted

## User Interaction Flow
1. User selects a photo and clicks "Move to Trash"
2. Photo is marked as "trashed" in the database
3. Photo is removed from normal view but stored in the trash bin
4. User can:
   - View trashed photos in the trash bin
   - Restore photos to their original location
   - Permanently delete selected photos
   - Empty the entire trash bin

## Implementation Details
- Photos in trash maintain their metadata and AWS Rekognition face indices
- Trashed photos are filtered out of normal search results and collections
- For AWS Rekognition integration, face indexes may be maintained but marked as inactive
- When permanently deleted, associated AWS resources (face indices, etc.) are properly cleaned up

## Technical Implementation
- Database schema includes a `trashed` boolean field and `trashedAt` timestamp
- API endpoints for trash operations:
  - `POST /api/photos/:id/trash` - Move to trash
  - `POST /api/photos/:id/restore` - Restore from trash
  - `DELETE /api/photos/:id` - Permanently delete
  - `GET /api/trash` - List trashed photos
  - `DELETE /api/trash` - Empty trash bin

## Configuration Options
- `TRASH_RETENTION_DAYS`: Number of days photos remain in trash before automatic deletion (default: 30)
- `TRASH_AUTO_DELETE`: Boolean to enable/disable automatic deletion (default: true)

## Future Enhancements
- Batch operations for trash management
- Trash collection categorization
- Advanced filtering of trashed content
- Selective restoration

---
**Note to LLM**: This document should be updated whenever changes are made to any trash-related functionality, including hiding images, temporary deletion, or modifications to any files that interact with the trash system. Whenever new files are added that relate to the trash system or existing files are modified to include trash-related functionality, please update this document accordingly. 