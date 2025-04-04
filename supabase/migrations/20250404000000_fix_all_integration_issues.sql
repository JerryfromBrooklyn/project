-- Fix All Integration Issues
-- This migration addresses common issues with face registration, historical matching, and photo display

-- Ensure user_faces table exists with proper structure
CREATE TABLE IF NOT EXISTS user_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    face_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, face_id)
);

-- Add necessary columns to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_id') THEN
        ALTER TABLE users ADD COLUMN face_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_updated_at') THEN
        ALTER TABLE users ADD COLUMN face_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_attributes') THEN
        ALTER TABLE users ADD COLUMN face_attributes JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create or replace function to get user's face ID from multiple sources
CREATE OR REPLACE FUNCTION get_user_face_id(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_face_id TEXT;
BEGIN
    -- First try the users table
    SELECT face_id INTO v_face_id FROM users WHERE id = p_user_id;
    
    -- If not found, try the user_faces table
    IF v_face_id IS NULL THEN
        SELECT face_id INTO v_face_id FROM user_faces WHERE user_id = p_user_id LIMIT 1;
    END IF;
    
    -- If still not found, try the face_data table if it exists
    IF v_face_id IS NULL THEN
        BEGIN
            SELECT face_id INTO v_face_id FROM face_data WHERE user_id = p_user_id LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- Table might not exist, ignore error
            NULL;
        END;
    END IF;
    
    RETURN v_face_id;
END;
$$;

-- Create or replace function to sync face registration across all tables
CREATE OR REPLACE FUNCTION sync_user_face_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a face_id is updated in users table, sync it to user_faces
    IF TG_TABLE_NAME = 'users' AND NEW.face_id IS NOT NULL THEN
        INSERT INTO user_faces (user_id, face_id)
        VALUES (NEW.id, NEW.face_id)
        ON CONFLICT (user_id, face_id) DO NOTHING;
    
    -- When a face_id is updated in user_faces, sync it to users
    ELSIF TG_TABLE_NAME = 'user_faces' AND NEW.face_id IS NOT NULL THEN
        UPDATE users
        SET face_id = NEW.face_id,
            face_updated_at = NEW.updated_at
        WHERE id = NEW.user_id AND (face_id IS NULL OR face_id <> NEW.face_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers for face_id synchronization
DROP TRIGGER IF EXISTS trigger_sync_users_face_id ON users;
CREATE TRIGGER trigger_sync_users_face_id
AFTER INSERT OR UPDATE OF face_id ON users
FOR EACH ROW
WHEN (NEW.face_id IS NOT NULL)
EXECUTE FUNCTION sync_user_face_id();

DROP TRIGGER IF EXISTS trigger_sync_user_faces_face_id ON user_faces;
CREATE TRIGGER trigger_sync_user_faces_face_id
AFTER INSERT OR UPDATE OF face_id ON user_faces
FOR EACH ROW
EXECUTE FUNCTION sync_user_face_id();

-- Create or replace function to fix face matching in photos
CREATE OR REPLACE FUNCTION fix_photo_face_matches(p_photo_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_photo RECORD;
    v_user_id UUID;
    v_face_data JSONB;
    v_face_ids TEXT[];
    v_matched_users JSONB;
BEGIN
    v_result := jsonb_build_object('success', false, 'message', 'No updates performed');
    
    -- Process a specific photo or all photos with faces
    FOR v_photo IN 
        SELECT p.id, p.user_id, p.metadata, p.faces, p.matched_users
        FROM photos p
        WHERE (p_photo_id IS NULL OR p.id = p_photo_id)
          AND p.faces IS NOT NULL
          AND jsonb_array_length(p.faces) > 0
    LOOP
        v_user_id := v_photo.user_id;
        v_face_data := v_photo.faces;
        v_face_ids := ARRAY[]::TEXT[];
        v_matched_users := v_photo.matched_users;
        
        -- If matched_users is null, initialize it
        IF v_matched_users IS NULL THEN
            v_matched_users := '[]'::JSONB;
        END IF;
        
        -- Collect all face IDs from the faces array
        IF v_face_data IS NOT NULL AND jsonb_typeof(v_face_data) = 'array' THEN
            SELECT array_agg(DISTINCT face_id) INTO v_face_ids
            FROM (
                SELECT jsonb_extract_path_text(face, 'faceId') AS face_id
                FROM jsonb_array_elements(v_face_data) AS face
                WHERE jsonb_extract_path_text(face, 'faceId') IS NOT NULL
            ) AS extracted_face_ids;
        END IF;
        
        -- Look for users with matching face IDs
        IF v_face_ids IS NOT NULL AND array_length(v_face_ids, 1) > 0 THEN
            -- Find users with matching face IDs
            WITH matching_users AS (
                SELECT DISTINCT u.id, u.email, u.face_id
                FROM users u
                WHERE u.face_id = ANY(v_face_ids)
                UNION
                SELECT DISTINCT u.id, u.email, uf.face_id
                FROM user_faces uf
                JOIN users u ON u.id = uf.user_id
                WHERE uf.face_id = ANY(v_face_ids)
            )
            SELECT jsonb_agg(
                jsonb_build_object(
                    'userId', mu.id,
                    'faceId', mu.face_id,
                    'email', mu.email,
                    'confidence', 90,
                    'matchedAt', now()
                )
            ) INTO v_matched_users
            FROM matching_users mu;
            
            IF v_matched_users IS NULL THEN
                v_matched_users := '[]'::JSONB;
            END IF;
            
            -- Update the photo with matched users
            UPDATE photos
            SET matched_users = v_matched_users,
                updated_at = NOW()
            WHERE id = v_photo.id;
        END IF;
    END LOOP;
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Photo face matches updated successfully',
        'processed_photo_id', p_photo_id
    );
    
    RETURN v_result;
END;
$$;

-- Create admin function to fix face registration issues
CREATE OR REPLACE FUNCTION admin_fix_face_registration(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_face_id TEXT;
    v_result JSONB;
BEGIN
    -- Get the user's face ID from any source
    SELECT get_user_face_id(p_user_id) INTO v_face_id;
    
    IF v_face_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No face ID found for user');
    END IF;
    
    -- Update all relevant tables with the face ID
    
    -- 1. Update users table
    UPDATE users
    SET face_id = v_face_id,
        face_updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 2. Ensure entry in user_faces table
    INSERT INTO user_faces (user_id, face_id)
    VALUES (p_user_id, v_face_id)
    ON CONFLICT (user_id, face_id) DO UPDATE
    SET updated_at = NOW();
    
    -- 3. Try to update face_data table if it exists
    BEGIN
        UPDATE face_data
        SET face_id = v_face_id,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Table might not exist, ignore error
        NULL;
    END;
    
    -- 4. Update matched_users in all photos with this face
    WITH photos_with_face AS (
        SELECT p.id
        FROM photos p,
             jsonb_array_elements(p.faces) face
        WHERE jsonb_extract_path_text(face, 'faceId') = v_face_id
    )
    UPDATE photos
    SET matched_users = COALESCE(matched_users, '[]'::JSONB) || 
                        jsonb_build_array(
                            jsonb_build_object(
                                'userId', p_user_id,
                                'faceId', v_face_id,
                                'confidence', 90,
                                'matchedAt', NOW()
                            )
                        )
    WHERE id IN (SELECT id FROM photos_with_face);
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Face registration fixed successfully',
        'user_id', p_user_id,
        'face_id', v_face_id
    );
    
    RETURN v_result;
END;
$$;

-- Create admin function to fix all users' face registrations
CREATE OR REPLACE FUNCTION admin_fix_all_face_registrations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_success_count INTEGER := 0;
    v_fail_count INTEGER := 0;
    v_result JSONB;
BEGIN
    FOR v_user IN 
        SELECT DISTINCT u.id
        FROM users u
        LEFT JOIN user_faces uf ON u.id = uf.user_id
        WHERE u.face_id IS NOT NULL OR uf.face_id IS NOT NULL
    LOOP
        v_result := admin_fix_face_registration(v_user.id);
        
        IF (v_result->>'success')::BOOLEAN THEN
            v_success_count := v_success_count + 1;
        ELSE
            v_fail_count := v_fail_count + 1;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Batch fix completed',
        'success_count', v_success_count,
        'fail_count', v_fail_count
    );
END;
$$;

-- Automatically fix all photo face matches
SELECT fix_photo_face_matches(); 