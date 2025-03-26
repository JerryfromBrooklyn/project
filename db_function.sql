-- This function provides a secure way to insert photos while bypassing RLS policies
-- It should be run in the Supabase SQL Editor

-- Create a function with security definer (runs with creator's permissions)
CREATE OR REPLACE FUNCTION public.insert_photo(
  photo_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_photo_id UUID;
BEGIN
  -- Insert the photo record using the provided JSON data
  -- This bypasses RLS policies due to SECURITY DEFINER
  INSERT INTO public.photos (
    id,
    storage_path,
    public_url,
    uploaded_by,
    file_size,
    file_type,
    faces,
    matched_users,
    face_ids,
    tags,
    location,
    venue,
    event_details,
    created_at,
    updated_at
  )
  VALUES (
    (photo_data->>'id')::UUID,
    photo_data->>'storage_path',
    photo_data->>'public_url',
    (photo_data->>'uploaded_by')::UUID,
    (photo_data->>'file_size')::BIGINT,
    photo_data->>'file_type',
    COALESCE(photo_data->'faces', '[]'::JSONB),
    COALESCE(photo_data->'matched_users', '[]'::JSONB),
    -- Convert JSON array to text[] for face_ids
    CASE
      WHEN photo_data ? 'face_ids' AND jsonb_typeof(photo_data->'face_ids') = 'array'
      THEN (SELECT array_agg(x#>>'{}') FROM jsonb_array_elements(photo_data->'face_ids') AS t(x))
      ELSE '{}'::text[]
    END,
    -- Convert JSON array to text[] for tags
    CASE
      WHEN photo_data ? 'tags' AND jsonb_typeof(photo_data->'tags') = 'array'
      THEN (SELECT array_agg(x#>>'{}') FROM jsonb_array_elements(photo_data->'tags') AS t(x))
      ELSE '{}'::text[]
    END,
    COALESCE(photo_data->'location', '{}'::JSONB),
    COALESCE(photo_data->'venue', '{}'::JSONB),
    COALESCE(photo_data->'event_details', '{}'::JSONB),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_photo_id;
  
  RETURN new_photo_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_photo(JSONB) TO authenticated;

-- Usage example:
-- SELECT insert_photo('{"id":"123e4567-e89b-12d3-a456-426614174000", "storage_path":"path/to/photo.jpg", "public_url":"https://example.com/photo.jpg", "uploaded_by":"user-id-here", "file_size":12345, "file_type":"image/jpeg"}'); 