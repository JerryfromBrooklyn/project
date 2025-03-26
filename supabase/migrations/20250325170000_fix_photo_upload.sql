-- Fix photo upload functionality by creating non-SECURITY DEFINER functions
-- This avoids permission issues while maintaining the same functionality

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.insert_photo(JSONB);
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);

-- Create a simplified version of execute_sql without SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the query for auditing purposes
  RAISE NOTICE 'Executing SQL: %', sql_query;
  
  -- Execute the SQL statement
  EXECUTE sql_query;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;

-- Create a simplified version of insert_photo without SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.insert_photo(
  photo_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_photo_id UUID;
BEGIN
  -- Insert the photo record using the provided JSON data
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
    event_id,
    folder_path,
    folder_name,
    title,
    description,
    date_taken,
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
    COALESCE(photo_data->'location', '{"lat": null, "lng": null, "name": null}'::JSONB),
    COALESCE(photo_data->'venue', '{"id": null, "name": null}'::JSONB),
    COALESCE(photo_data->'event_details', '{"name": null, "date": null, "type": null}'::JSONB),
    (photo_data->>'event_id')::UUID,
    photo_data->>'folder_path',
    photo_data->>'folder_name',
    photo_data->>'title',
    photo_data->>'description',
    (photo_data->>'date_taken')::TIMESTAMPTZ,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_photo_id;
  
  RETURN new_photo_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_photo(JSONB) TO authenticated;

-- Create a helper function for minimal photo insertion
CREATE OR REPLACE FUNCTION public.insert_minimal_photo(
  p_id UUID,
  p_storage_path TEXT,
  p_public_url TEXT,
  p_uploaded_by UUID,
  p_file_size BIGINT,
  p_file_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_photo_id UUID;
BEGIN
  -- Insert minimal photo data
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
    created_at,
    updated_at
  )
  VALUES (
    p_id,
    p_storage_path,
    p_public_url,
    p_uploaded_by,
    p_file_size,
    p_file_type,
    '[]'::JSONB,
    '[]'::JSONB,
    '{}'::TEXT[],
    '{}'::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO new_photo_id;
  
  RETURN new_photo_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_minimal_photo(UUID, TEXT, TEXT, UUID, BIGINT, TEXT) TO authenticated; 