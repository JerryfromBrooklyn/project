# Face Matching Fix

This fix addresses the issue where photos with faces aren't properly matching with registered user profiles. The problem occurs because the system is generating random local face IDs for detected faces in photos and trying to match them with registered face IDs using string comparison, which will never work.

## Root Cause

1. When a photo is uploaded and faces are detected, the system:
   - Generates random local face IDs like `local-15eedef3-1743082588696-tebmw`
   - Stores these IDs with the photo

2. When trying to match these faces with registered users:
   - The system attempts to find exact string matches between the random local IDs and face IDs in the face_data table
   - Because the local IDs include random components and timestamps, they will never match registered face IDs

## The Fix

The fix has two main components:

1. **Server-side (SQL) changes**:
   - Update the `update_photo_face_ids_adapter` function to accept and process matched users
   - Create a reprocessing function to find matches for existing photos

2. **Client-side (JavaScript) changes**:
   - Add a call to `FaceIndexingService.searchFaces` to find matches using AWS Rekognition
   - Pass the matched users to the database function

## How to Apply the Fix

### Step 1: Apply SQL Changes

1. Connect to your Supabase database using SQL Editor or any PostgreSQL client
2. Execute the SQL script in `supabase/face_matching/APPLY_FACE_MATCHING_FIX.sql`
3. Verify the changes by running the queries in `supabase/face_matching/verify_face_matching.sql`

### Step 2: Update the PhotoService.js File

1. Update the `src/services/PhotoService.js` file with the changes shown below:

```javascript
// After indexFacesInPhoto is called and face_ids are added to metadata:
try {
    console.log('[DEBUG] Searching for face matches in registered users...');
    // Use the actual image data for face matching
    const matches = await FaceIndexingService.searchFaces(imageBytes);
    
    if (matches && matches.length > 0) {
        console.log(`[DEBUG] Found ${matches.length} matching users!`, matches);
        
        // Add these matches to the metadata
        metadata.matched_users = matches.map(match => ({
            userId: match.userId,
            confidence: match.confidence
        }));
        
        console.log('[DEBUG] Added matched_users to metadata:', metadata.matched_users);
    } else {
        console.log('[DEBUG] No matching users found for detected faces');
        metadata.matched_users = [];
    }
} catch (matchError) {
    console.error('[ERROR] Error matching faces:', matchError);
    // Continue even if matching fails
    metadata.matched_users = [];
}
```

2. Update the RPC call to pass matched users:

```javascript
// In the RPC function call for face updates:
const { error: faceError } = await supabase.rpc(
    'update_photo_face_ids_adapter',
    {
        p_id: photoId,
        p_face_ids: metadata.face_ids,
        p_faces: metadata.faces,
        p_matched_users: metadata.matched_users || []
    }
);
```

3. Update the direct database update fallback to include matched users:

```javascript
// In the direct database update fallback:
const { error: directFaceError } = await supabase
    .from('photos')
    .update({
        faces: metadata.faces,
        face_ids: metadata.face_ids,
        matched_users: metadata.matched_users || []
    })
    .eq('id', photoId);
```

### Step 3: Process Existing Photos (Optional)

If you have existing photos with faces that should be matched to users:

1. Run the reprocessing function in batches:
```sql
SELECT * FROM reprocess_photos_for_face_matching() LIMIT 100;
```

2. Repeat as needed to process all photos

## Verifying the Fix

After applying the fix:

1. Upload a new photo with faces
2. Check the browser console for `[DEBUG] Found X matching users!` messages
3. Verify that the photo shows up with user matches in the UI
4. If faces are detected but no matches are found, it could mean:
   - The user's face hasn't been registered
   - The face in the photo isn't similar enough to the registered face
   - There might be another issue with the AWS Rekognition configuration

## Additional Information

- The fix doesn't modify the existing face detection process, only adds proper face matching
- The random local face IDs are still generated and stored, but they're now supplemented with actual face matching
- For face matching to work, users must first register their faces using the face registration feature 