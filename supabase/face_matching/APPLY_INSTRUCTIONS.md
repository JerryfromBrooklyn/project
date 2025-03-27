# Face Matching Fix - Application Instructions

We've identified and fixed the issue with face matching functionality. The face detection and indexing was working correctly, but the photos weren't being matched to user profiles due to missing database functions and triggers.

## How to Apply the Fix

### Option 1: Using Supabase Studio (Recommended)

1. Log in to your Supabase project at https://app.supabase.com
2. Go to the "SQL Editor" tab
3. Create a new query
4. Copy the entire contents of `fix_face_matching_complete.sql` and paste it into the SQL editor
5. Execute the script
6. Wait for the script to complete (it might take a few moments as it scans existing photos)

If you encounter any errors during execution:

1. Make note of the error message
2. Check if the script partially executed up to that point
3. Try running the remaining parts of the script separately

### Option 2: Using Supabase Migration

1. The complete fix is also available as a migration in `supabase/migrations/20250327135000_fix_face_matching.sql`
2. If you have access to the Supabase CLI and project configuration, you can run:
   ```bash
   supabase db push
   ```

## Testing the Fix

After applying the fix:

1. Upload a new photo with your face in it
2. The system should automatically match it to your profile
3. Verify that your profile appears in the matched users for the photo

If the automatic matching doesn't work immediately:

1. Go to the "SQL Editor" tab in Supabase Studio
2. Run the following command to manually trigger a face matching scan:
   ```sql
   SELECT scan_all_photos_for_face_matches();
   ```
3. This will scan all existing photos and match them with registered faces

## What This Fix Does

1. Creates or updates the structure of the `face_data` and `photo_faces` tables
2. Implements the `handle_face_matching` function to update photos when matches are found
3. Adds a trigger to automatically run this function on updates
4. Implements a function to match faces when users register their face
5. Implements a function to process photos when they're uploaded
6. Creates a view for easy querying of matched photos
7. Provides a function to manually scan for matches

## Verification

You can verify the fix has been applied by checking:

1. That the `photo_faces` table exists
2. That the triggers are properly set up on the `photos` and `face_data` tables
3. That the `process_photo_faces` and `match_face_to_photos` functions exist
4. That the `user_matched_photos` view is available 