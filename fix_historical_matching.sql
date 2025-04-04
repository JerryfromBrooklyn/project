-- Fix historical matching to use simple_photos table instead of photos

-- Create a function to handle historical matching with simple_photos table
CREATE OR REPLACE FUNCTION process_historical_matching(
    p_face_id TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    matched_count INTEGER := 0;
    matched_photos JSONB := '[]'::jsonb;
    photo_record RECORD;
BEGIN
    -- Look for matches directly in simple_photos table
    FOR photo_record IN 
        SELECT 
            id, 
            public_url, 
            COALESCE(matched_users, '[]'::jsonb) as matched_users,
            COALESCE(faces, '[]'::jsonb) as faces,
            COALESCE(face_ids, '{}'::text[]) as face_ids
        FROM 
            simple_photos
        WHERE 
            -- Look for the face ID in the faces array
            (jsonb_path_exists(faces, '$[*] ? (@.faceId == $fid)', jsonb_build_object('fid', p_face_id))
            OR
            -- Look for the face ID in the face_ids array
            p_face_id = ANY(face_ids))
            AND
            -- Exclude photos that already have this user as a match
            NOT EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(matched_users) AS mu 
                WHERE (mu->>'userId')::UUID = p_user_id
            )
    LOOP
        -- Add match to photo
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
        
        -- Count the match
        matched_count := matched_count + 1;
        
        -- Add to matched photos array
        matched_photos := matched_photos || jsonb_build_object(
            'photoId', photo_record.id,
            'photoUrl', photo_record.public_url
        );
    END LOOP;
    
    -- Return results
    result := jsonb_build_object(
        'success', true,
        'matchCount', matched_count,
        'matches', matched_photos,
        'message', format('Found and processed %s historical matches', matched_count)
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_historical_matching(TEXT, UUID) TO authenticated;

-- Create a helper function to fix registration and run historical matching in one step
CREATE OR REPLACE FUNCTION fix_face_registration_and_run_matching(
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
    face_data_record RECORD;
    matched_result JSONB;
BEGIN
    -- Get face data
    SELECT * INTO face_data_record FROM face_data WHERE user_id = p_user_id AND face_id = p_face_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Face data not found for user',
            'user_id', p_user_id,
            'face_id', p_face_id
        );
    END IF;
    
    -- Fix registration in users table
    UPDATE users
    SET 
        face_id = p_face_id,
        face_attributes = face_data_record.attributes,
        face_updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Ensure entry in user_faces table
    INSERT INTO user_faces (user_id, face_id)
    VALUES (p_user_id, p_face_id)
    ON CONFLICT (user_id, face_id) DO NOTHING;
    
    -- Run historical matching
    matched_result := process_historical_matching(p_face_id, p_user_id);
    
    -- Build final result
    result := jsonb_build_object(
        'success', true,
        'registration_fixed', true,
        'historical_matching', matched_result,
        'message', 'Face registration fixed and historical matching completed'
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_face_registration_and_run_matching(UUID, TEXT) TO authenticated; 