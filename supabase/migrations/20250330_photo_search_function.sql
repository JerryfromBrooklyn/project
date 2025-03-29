-- Create a reliable function for searching photos that match a specific user
-- This handles the JSONB matching correctly against both photos and simple_photos tables

CREATE OR REPLACE FUNCTION public.search_photos_for_user(user_id UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    matched_photos JSONB[];
    photo_record RECORD;
BEGIN
    -- First, search the photos table
    FOR photo_record IN (
        SELECT *
        FROM public.photos
        WHERE 
            -- Check if this user ID appears in the matched_users array
            EXISTS (
                SELECT 1
                FROM jsonb_array_elements(matched_users) as elem
                WHERE elem->>'userId' = user_id::TEXT
            )
        ORDER BY created_at DESC
    ) LOOP
        matched_photos := array_append(
            matched_photos, 
            to_jsonb(photo_record)
        );
    END LOOP;
    
    -- Next, search the simple_photos table
    FOR photo_record IN (
        SELECT *
        FROM public.simple_photos
        WHERE 
            -- Check if this user ID appears in the matched_users array
            EXISTS (
                SELECT 1
                FROM jsonb_array_elements(matched_users) as elem
                WHERE elem->>'userId' = user_id::TEXT
            )
        ORDER BY created_at DESC
    ) LOOP
        -- Skip duplicates (photos that might be in both tables)
        IF NOT EXISTS (
            SELECT 1
            FROM unnest(matched_photos) as mp
            WHERE mp->>'id' = photo_record.id::TEXT
        ) THEN
            matched_photos := array_append(
                matched_photos, 
                to_jsonb(photo_record)
            );
        END IF;
    END LOOP;
    
    -- Return results
    IF array_length(matched_photos, 1) > 0 THEN
        RETURN QUERY 
        SELECT unnest(matched_photos);
    END IF;
    
    RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_photos_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_photos_for_user TO anon;
GRANT EXECUTE ON FUNCTION public.search_photos_for_user TO service_role; 