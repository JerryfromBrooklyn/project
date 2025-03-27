-- Migration to add repair functions for face matching

-- Function to repair all photo matches by scanning face_data and photos tables
CREATE OR REPLACE FUNCTION repair_all_photo_matches()
RETURNS JSONB AS $$
DECLARE
    v_total_photos INTEGER := 0;
    v_total_matches INTEGER := 0;
    v_total_users INTEGER := 0;
    v_match_count INTEGER := 0;
    v_user_record RECORD;
    v_face_record RECORD;
    v_photo_record RECORD;
    v_user_ids UUID[] := '{}';
BEGIN
    -- Count photos and users in the system
    SELECT COUNT(*) INTO v_total_photos FROM photos;
    SELECT COUNT(*) INTO v_total_users FROM auth.users;
    
    -- Step 1: For each user with face data
    FOR v_user_record IN 
        SELECT DISTINCT user_id 
        FROM face_data 
        WHERE face_id IS NOT NULL
    LOOP
        -- Collect user IDs for reporting
        v_user_ids := array_append(v_user_ids, v_user_record.user_id);
        
        -- Get all face IDs for this user
        FOR v_face_record IN
            SELECT face_id
            FROM face_data
            WHERE user_id = v_user_record.user_id
            AND face_id IS NOT NULL
        LOOP
            -- Step 2: Find photos that have this face ID
            FOR v_photo_record IN
                SELECT p.id, p.matched_users, p.face_ids
                FROM photos p
                WHERE 
                    -- Check in the face_ids column
                    (p.face_ids IS NOT NULL AND 
                     v_face_record.face_id = ANY(p.face_ids))
                    OR
                    -- Check in the faces array (using JSON containment)
                    (p.faces IS NOT NULL AND 
                     jsonb_path_exists(p.faces, ('$[*] ? (@.faceId == "' || v_face_record.face_id || '")')::jsonpath))
            LOOP
                -- Check if the user is already in matched_users
                IF v_photo_record.matched_users IS NULL OR 
                   NOT jsonb_path_exists(v_photo_record.matched_users, ('$[*] ? (@.userId == "' || v_user_record.user_id || '")') ::jsonpath) THEN
                    
                    -- Get user profile data
                    DECLARE
                        v_user_name TEXT;
                        v_avatar_url TEXT;
                        v_updated_matches JSONB;
                    BEGIN
                        -- Try to get user data from users table first
                        SELECT full_name, avatar_url 
                        INTO v_user_name, v_avatar_url
                        FROM users
                        WHERE id = v_user_record.user_id;
                        
                        -- If not found, try user_profiles
                        IF v_user_name IS NULL THEN
                            SELECT 
                                metadata->>'full_name',
                                metadata->>'avatar_url'
                            INTO v_user_name, v_avatar_url
                            FROM user_profiles
                            WHERE user_id = v_user_record.user_id;
                        END IF;
                        
                        -- If still not found, use email from auth.users
                        IF v_user_name IS NULL THEN
                            SELECT email INTO v_user_name
                            FROM auth.users
                            WHERE id = v_user_record.user_id;
                        END IF;
                        
                        -- Create new match object
                        IF v_photo_record.matched_users IS NULL THEN
                            v_updated_matches := jsonb_build_array(
                                jsonb_build_object(
                                    'userId', v_user_record.user_id,
                                    'fullName', COALESCE(v_user_name, 'Unknown User'),
                                    'avatarUrl', v_avatar_url,
                                    'confidence', 95.0
                                )
                            );
                        ELSE
                            v_updated_matches := v_photo_record.matched_users || 
                                jsonb_build_array(
                                    jsonb_build_object(
                                        'userId', v_user_record.user_id,
                                        'fullName', COALESCE(v_user_name, 'Unknown User'),
                                        'avatarUrl', v_avatar_url,
                                        'confidence', 95.0
                                    )
                                );
                        END IF;
                        
                        -- Update the photo
                        UPDATE photos
                        SET matched_users = v_updated_matches,
                            updated_at = NOW()
                        WHERE id = v_photo_record.id;
                        
                        v_match_count := v_match_count + 1;
                    END;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Return summary
    RETURN jsonb_build_object(
        'success', TRUE,
        'total_photos', v_total_photos,
        'total_users', v_total_users,
        'processed_users', array_length(v_user_ids, 1),
        'total_matches_added', v_match_count,
        'user_ids_processed', v_user_ids
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to repair all face_data entries
CREATE OR REPLACE FUNCTION repair_face_data()
RETURNS JSONB AS $$
DECLARE
    v_count_fixed INTEGER := 0;
    v_count_total INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Count total records
    SELECT COUNT(*) INTO v_count_total FROM face_data;
    
    -- Fix records with null face_id but data in face_data
    FOR v_record IN
        SELECT id, face_data 
        FROM face_data
        WHERE face_id IS NULL 
        AND face_data->>'aws_face_id' IS NOT NULL
    LOOP
        UPDATE face_data
        SET face_id = face_data->>'aws_face_id',
            updated_at = NOW()
        WHERE id = v_record.id;
        
        v_count_fixed := v_count_fixed + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'total_records', v_count_total,
        'fixed_records', v_count_fixed
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profiles from auth data
CREATE OR REPLACE FUNCTION repair_user_profiles() 
RETURNS JSONB AS $$
DECLARE
    v_count_total INTEGER := 0;
    v_count_fixed INTEGER := 0;
    v_user RECORD;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO v_count_total FROM auth.users;
    
    -- Find users without profiles
    FOR v_user IN
        SELECT 
            au.id, 
            au.email,
            au.raw_user_meta_data
        FROM 
            auth.users au
        LEFT JOIN 
            users u ON au.id = u.id
        WHERE 
            u.id IS NULL
    LOOP
        -- Create user record
        INSERT INTO users (
            id,
            email,
            full_name,
            avatar_url,
            role,
            created_at,
            updated_at
        ) VALUES (
            v_user.id,
            v_user.email,
            v_user.raw_user_meta_data->>'full_name',
            v_user.raw_user_meta_data->>'avatar_url',
            COALESCE(v_user.raw_user_meta_data->>'user_type', 'attendee'),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Create user_profiles record if that table exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles'
        ) THEN
            INSERT INTO user_profiles (
                id,
                user_id,
                metadata,
                settings,
                created_at,
                updated_at
            ) VALUES (
                v_user.id,
                v_user.id,
                jsonb_build_object(
                    'full_name', v_user.raw_user_meta_data->>'full_name',
                    'avatar_url', v_user.raw_user_meta_data->>'avatar_url',
                    'user_type', COALESCE(v_user.raw_user_meta_data->>'user_type', 'attendee')
                ),
                '{}'::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
        
        v_count_fixed := v_count_fixed + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'total_users', v_count_total,
        'fixed_users', v_count_fixed
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 