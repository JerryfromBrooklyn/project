-- Fix the face registration system to use a single table (simple_photos)
-- and ensure that UI properly shows registered faces

-- 1. Create necessary functions and tables if they don't exist

-- Make sure user_faces table exists (used by UI to check registration status)
CREATE TABLE IF NOT EXISTS public.user_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    face_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, face_id)
);

-- Make sure face_data table has correct columns
ALTER TABLE public.face_data 
ADD COLUMN IF NOT EXISTS face_id TEXT,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS face_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Make sure users table has face columns needed by UI
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS face_id TEXT,
ADD COLUMN IF NOT EXISTS face_attributes JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS face_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Create an admin function to check and fix face attributes
CREATE OR REPLACE FUNCTION admin_check_user_face_attributes(p_user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    face_record RECORD;
    has_user_data BOOLEAN;
    has_face_data BOOLEAN;
    result JSONB;
BEGIN
    -- Check user record
    SELECT * INTO user_record FROM users WHERE id = p_user_id;
    has_user_data := (user_record.face_id IS NOT NULL);
    
    -- Check face_data record
    SELECT * INTO face_record FROM face_data WHERE user_id = p_user_id LIMIT 1;
    has_face_data := FOUND AND (face_record.face_id IS NOT NULL);
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'user_data', jsonb_build_object(
            'has_user_record', has_user_data,
            'face_id', user_record.face_id,
            'face_attributes', user_record.face_attributes
        ),
        'face_data', jsonb_build_object(
            'has_face_data', has_face_data,
            'face_id', face_record.face_id,
            'attributes', face_record.attributes
        )
    );
    
    RETURN result;
END;
$$;

-- 3. Create a function to update user face attributes
CREATE OR REPLACE FUNCTION admin_update_user_face_attributes(
    p_user_id UUID,
    p_face_id TEXT,
    p_attributes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update users table
    UPDATE users
    SET 
        face_id = p_face_id,
        face_attributes = p_attributes,
        face_updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Update or insert face_data
    INSERT INTO face_data (user_id, face_id, attributes, face_data, is_verified, created_at, updated_at)
    VALUES (
        p_user_id, 
        p_face_id, 
        p_attributes, 
        jsonb_build_object('aws_face_id', p_face_id, 'attributes', p_attributes),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        face_id = p_face_id,
        attributes = p_attributes,
        face_data = jsonb_build_object('aws_face_id', p_face_id, 'attributes', p_attributes),
        is_verified = true,
        updated_at = NOW();
    
    -- Ensure entry in user_faces table
    INSERT INTO user_faces (user_id, face_id, created_at, updated_at)
    VALUES (p_user_id, p_face_id, NOW(), NOW())
    ON CONFLICT (user_id, face_id) 
    DO UPDATE SET updated_at = NOW();
    
    -- Return success
    result := jsonb_build_object(
        'success', true,
        'message', 'Face attributes updated successfully',
        'user_id', p_user_id,
        'face_id', p_face_id
    );
    
    RETURN result;
END;
$$;

-- 4. Create a function to search simple_photos for historical matches
CREATE OR REPLACE FUNCTION search_simple_photos_for_face_matches(
    p_user_id UUID,
    p_face_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    matched_photos JSONB := '[]'::jsonb;
    photo_record RECORD;
BEGIN
    -- Search simple_photos table for the face
    FOR photo_record IN 
        SELECT id, public_url, matched_users 
        FROM simple_photos 
        WHERE face_ids ? p_face_id OR faces @> jsonb_build_array(jsonb_build_object('faceId', p_face_id))
    LOOP
        -- Check if user is already matched
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(photo_record.matched_users) AS mu 
            WHERE (mu->>'userId')::UUID = p_user_id
        ) THEN
            -- Add user match to photo
            UPDATE simple_photos
            SET matched_users = matched_users || jsonb_build_array(
                jsonb_build_object(
                    'userId', p_user_id,
                    'faceId', p_face_id,
                    'confidence', 95.0,
                    'matchedAt', NOW()
                )
            )
            WHERE id = photo_record.id;
            
            -- Add to result
            matched_photos := matched_photos || jsonb_build_object(
                'photoId', photo_record.id,
                'photoUrl', photo_record.public_url
            );
        END IF;
    END LOOP;
    
    -- Return result
    result := jsonb_build_object(
        'success', true,
        'matchCount', jsonb_array_length(matched_photos),
        'matches', matched_photos
    );
    
    RETURN result;
END;
$$;

-- 5. Fix permissions for these functions
GRANT EXECUTE ON FUNCTION admin_check_user_face_attributes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_face_attributes(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION search_simple_photos_for_face_matches(UUID, TEXT) TO authenticated;

-- 6. Fix unique constraint on face_data
ALTER TABLE face_data DROP CONSTRAINT IF EXISTS face_data_user_id_key;
ALTER TABLE face_data ADD CONSTRAINT face_data_user_id_key UNIQUE (user_id);

-- 7. Update existing face registrations
DO $$
DECLARE
    face_rec RECORD;
BEGIN
    -- Fix any existing face registrations
    FOR face_rec IN SELECT * FROM face_data WHERE face_id IS NOT NULL
    LOOP
        -- Update users table
        UPDATE users
        SET 
            face_id = face_rec.face_id,
            face_attributes = face_rec.attributes,
            face_updated_at = face_rec.updated_at
        WHERE id = face_rec.user_id;
        
        -- Add to user_faces
        INSERT INTO user_faces (user_id, face_id, created_at, updated_at)
        VALUES (face_rec.user_id, face_rec.face_id, face_rec.created_at, face_rec.updated_at)
        ON CONFLICT (user_id, face_id) DO NOTHING;
    END LOOP;
END;
$$; 