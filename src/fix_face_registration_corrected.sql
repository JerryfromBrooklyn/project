-- Fix face registration by adding missing columns to users table
-- This addresses the issue with admin_check_user_face_attributes and admin_update_user_face_attributes functions

-- First, let's check if the columns exist and add them if they don't
DO $$
BEGIN
    -- Add face_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'face_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN face_id TEXT;
        RAISE NOTICE 'Added face_id column to users table';
    END IF;

    -- Add face_attributes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'face_attributes'
    ) THEN
        ALTER TABLE public.users ADD COLUMN face_attributes JSONB DEFAULT '{}'::JSONB;
        RAISE NOTICE 'Added face_attributes column to users table';
    END IF;

    -- Add face_updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'face_updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN face_updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added face_updated_at column to users table';
    END IF;

    -- Add attributes column to face_data table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'face_data' AND column_name = 'attributes'
    ) THEN
        ALTER TABLE public.face_data ADD COLUMN attributes JSONB DEFAULT '{}'::JSONB;
        RAISE NOTICE 'Added attributes column to face_data table';
    END IF;

    -- Check if user_id is UNIQUE in face_data table, if not add constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE c.contype = 'u' 
        AND c.conrelid = 'face_data'::regclass 
        AND n.nspname = 'public'
        AND array_position(c.conkey, (
            SELECT a.attnum FROM pg_attribute a
            WHERE a.attrelid = 'face_data'::regclass
            AND a.attname = 'user_id'
        )) IS NOT NULL
    ) THEN
        BEGIN
            ALTER TABLE public.face_data ADD CONSTRAINT face_data_user_id_key UNIQUE (user_id);
            RAISE NOTICE 'Added UNIQUE constraint on user_id column in face_data table';
        EXCEPTION WHEN duplicate_table THEN
            RAISE NOTICE 'UNIQUE constraint on user_id column in face_data table already exists';
        END;
    END IF;

    RAISE NOTICE 'Database schema update complete';
END $$;

-- Now, let's also migrate existing face_data entries to ensure consistency
DO $$
DECLARE
    v_record RECORD;
BEGIN
    -- First migrate face_data.face_data to face_data.attributes if needed
    FOR v_record IN 
        SELECT 
            id,
            user_id, 
            face_id, 
            face_data
        FROM 
            public.face_data
        WHERE 
            face_data IS NOT NULL AND (attributes IS NULL OR attributes = '{}'::JSONB)
    LOOP
        -- Update face_data table with attributes
        UPDATE public.face_data
        SET 
            attributes = v_record.face_data
        WHERE 
            id = v_record.id;
            
        RAISE NOTICE 'Updated face_data entry % with attributes from face_data column', v_record.id;
    END LOOP;

    -- For each entry in face_data
    FOR v_record IN 
        SELECT 
            fd.user_id, 
            fd.face_id, 
            COALESCE(fd.attributes, fd.face_data) AS attributes
        FROM 
            public.face_data fd
        LEFT JOIN 
            public.users u ON fd.user_id = u.id
        WHERE 
            u.face_id IS NULL OR u.face_attributes IS NULL
    LOOP
        -- Update users table with face_data information
        UPDATE public.users
        SET 
            face_id = v_record.face_id,
            face_attributes = v_record.attributes,
            face_updated_at = NOW()
        WHERE 
            id = v_record.user_id;
            
        RAISE NOTICE 'Updated user % with face_id %', v_record.user_id, v_record.face_id;
    END LOOP;
    
    -- For each entry in user_faces (as a backup)
    FOR v_record IN 
        SELECT 
            uf.user_id, 
            uf.face_id
        FROM 
            public.user_faces uf
        LEFT JOIN 
            public.users u ON uf.user_id = u.id
        WHERE 
            u.face_id IS NULL
        -- Important: Take the newest face ID for a user (determined by created_at or updated_at)
        ORDER BY 
            uf.created_at DESC,
            uf.updated_at DESC
    LOOP
        -- Only update if the user still doesn't have a face_id
        UPDATE public.users
        SET 
            face_id = v_record.face_id,
            face_updated_at = NOW()
        WHERE 
            id = v_record.user_id AND face_id IS NULL;
            
        RAISE NOTICE 'Updated user % with face_id % from user_faces table', v_record.user_id, v_record.face_id;
        
        -- After updating once, we can stop processing additional face_ids for this user
        -- by breaking out of the loop for this user
    END LOOP;
    
    RAISE NOTICE 'Data migration complete';
END $$;

-- Create a utility function to synchronize face data across tables
CREATE OR REPLACE FUNCTION public.sync_user_face_data()
RETURNS TABLE (
    user_id UUID,
    face_id TEXT,
    synchronized BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_face_id TEXT;
    v_synchronized BOOLEAN;
BEGIN
    -- Process each user
    FOR v_record IN 
        SELECT u.id 
        FROM public.users u
    LOOP
        user_id := v_record.id;
        v_synchronized := FALSE;
        
        -- Try to get face_id from different sources in order of preference
        -- 1. From users table
        SELECT face_id INTO v_face_id FROM public.users WHERE id = user_id AND face_id IS NOT NULL;
        
        -- 2. From face_data table 
        IF v_face_id IS NULL THEN
            SELECT face_id INTO v_face_id FROM public.face_data WHERE user_id = user_id AND face_id IS NOT NULL;
        END IF;
        
        -- 3. From user_faces table (taking most recent)
        IF v_face_id IS NULL THEN
            SELECT face_id INTO v_face_id 
            FROM public.user_faces 
            WHERE user_id = user_id 
            ORDER BY created_at DESC, updated_at DESC
            LIMIT 1;
        END IF;
        
        -- If we found a face_id, update tables
        IF v_face_id IS NOT NULL THEN
            -- Update users table if it doesn't have a face_id yet
            UPDATE public.users
            SET face_id = v_face_id
            WHERE id = user_id AND face_id IS NULL;
            
            -- Update or insert into face_data
            BEGIN
                INSERT INTO public.face_data (user_id, face_id)
                VALUES (user_id, v_face_id)
                ON CONFLICT (user_id) 
                DO UPDATE SET face_id = v_face_id
                WHERE public.face_data.face_id IS NULL;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error updating face_data for user %: %', user_id, SQLERRM;
            END;
            
            -- Check if this face_id is already in user_faces
            IF NOT EXISTS (
                SELECT 1 FROM public.user_faces 
                WHERE user_id = user_id AND face_id = v_face_id
            ) THEN
                -- Insert only if not exists (no conflict possible since there's no unique constraint)
                INSERT INTO public.user_faces (user_id, face_id)
                VALUES (user_id, v_face_id);
            END IF;
            
            v_synchronized := TRUE;
        END IF;
        
        face_id := v_face_id;
        synchronized := v_synchronized;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Update the admin_check_user_face_attributes function to handle the columns properly
CREATE OR REPLACE FUNCTION public.admin_check_user_face_attributes(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data JSONB;
  face_data JSONB;
  column_exists BOOLEAN;
BEGIN
  -- Check if face_id column exists in users table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'face_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Get user data from users table
    SELECT jsonb_build_object(
      'has_user_record', true,
      'face_id', face_id,
      'face_attributes', face_attributes,
      'face_updated_at', face_updated_at
    ) INTO user_data
    FROM public.users
    WHERE id = p_user_id;
  ELSE
    -- Handle case where columns don't exist yet
    SELECT jsonb_build_object(
      'has_user_record', true,
      'error', 'Missing columns in users table'
    ) INTO user_data
    FROM public.users
    WHERE id = p_user_id;
  END IF;
  
  -- If user doesn't exist in public.users
  IF user_data IS NULL THEN
    user_data := jsonb_build_object(
      'has_user_record', false
    );
  END IF;
  
  -- Check if attributes column exists in face_data table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'face_data' AND column_name = 'attributes'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- Get face data with attributes
    SELECT jsonb_build_object(
      'has_face_data', true,
      'face_id', face_id,
      'attributes', attributes,
      'updated_at', updated_at
    ) INTO face_data
    FROM public.face_data
    WHERE user_id = p_user_id;
  ELSE
    -- Get face data without attributes column
    SELECT jsonb_build_object(
      'has_face_data', true,
      'face_id', face_id,
      'face_data', face_data,
      'updated_at', updated_at
    ) INTO face_data
    FROM public.face_data
    WHERE user_id = p_user_id;
  END IF;
  
  -- If no face data
  IF face_data IS NULL THEN
    face_data := jsonb_build_object(
      'has_face_data', false
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_data', user_data,
    'face_data', face_data
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Update the admin_update_user_face_attributes function to ensure it works with the schema
CREATE OR REPLACE FUNCTION public.admin_update_user_face_attributes(p_user_id UUID, p_face_id TEXT, p_attributes JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_user_exists BOOLEAN;
  column_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'code', 'USER_NOT_FOUND'
    );
  END IF;

  -- Check if face_id column exists in users table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'face_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- Add the necessary columns to users table
    ALTER TABLE public.users ADD COLUMN face_id TEXT;
    ALTER TABLE public.users ADD COLUMN face_attributes JSONB DEFAULT '{}'::JSONB;
    ALTER TABLE public.users ADD COLUMN face_updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Update the users table with face data
  UPDATE public.users
  SET 
    face_id = p_face_id,
    face_attributes = p_attributes,
    face_updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'face_id', face_id,
    'face_updated_at', face_updated_at
  ) INTO result;
  
  -- If no rows were affected but no error was raised, the user might exist in auth.users but not in public.users
  IF result IS NULL THEN
    -- Insert into public.users if not exists
    INSERT INTO public.users (id, face_id, face_attributes, face_updated_at)
    VALUES (p_user_id, p_face_id, p_attributes, NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
      face_id = p_face_id,
      face_attributes = p_attributes,
      face_updated_at = NOW()
    RETURNING jsonb_build_object(
      'id', id,
      'face_id', face_id,
      'face_updated_at', face_updated_at
    ) INTO result;
  END IF;
  
  -- Check if attributes column exists in face_data table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'face_data' AND column_name = 'attributes'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- Add the attributes column to face_data table
    ALTER TABLE public.face_data ADD COLUMN attributes JSONB DEFAULT '{}'::JSONB;
  END IF;
  
  -- Also update or insert into face_data table to ensure consistency
  BEGIN
    INSERT INTO public.face_data (user_id, face_id, attributes, updated_at)
    VALUES (p_user_id, p_face_id, p_attributes, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET
      face_id = p_face_id,
      attributes = p_attributes,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- If the unique constraint doesn't exist, we need to handle differently
    DELETE FROM public.face_data WHERE user_id = p_user_id;
    INSERT INTO public.face_data (user_id, face_id, attributes, updated_at)
    VALUES (p_user_id, p_face_id, p_attributes, NOW());
  END;
  
  -- Also make sure this face ID is recorded in user_faces table
  IF NOT EXISTS (
    SELECT 1 FROM public.user_faces 
    WHERE user_id = p_user_id AND face_id = p_face_id
  ) THEN
    INSERT INTO public.user_faces (user_id, face_id)
    VALUES (p_user_id, p_face_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', result
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$; 