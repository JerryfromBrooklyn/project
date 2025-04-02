-- Create linked_accounts table to store account linkages
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_group_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each user can only be in one identity group
  CONSTRAINT unique_user_identity UNIQUE (user_id)
);

-- Create RLS policies
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own linked accounts
CREATE POLICY "Users can view their linked accounts"
  ON linked_accounts
  FOR SELECT
  USING (auth.uid() = user_id OR 
         EXISTS (
           SELECT 1 FROM linked_accounts la 
           WHERE la.identity_group_id = linked_accounts.identity_group_id 
           AND la.user_id = auth.uid()
         ));

-- Allow users to link their own account
CREATE POLICY "Users can create their own links"
  ON linked_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_linked_accounts_identity_group
  ON linked_accounts(identity_group_id);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id
  ON linked_accounts(user_id);

-- Function to link two user accounts
CREATE OR REPLACE FUNCTION link_user_accounts(
  p_primary_user_id UUID, 
  p_secondary_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity_group_id UUID;
  v_primary_existing_link linked_accounts%ROWTYPE;
  v_secondary_existing_link linked_accounts%ROWTYPE;
BEGIN
  -- Check if users exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_primary_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Primary user not found');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_secondary_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Secondary user not found');
  END IF;
  
  -- Check if primary user already has an identity group
  SELECT * INTO v_primary_existing_link 
  FROM linked_accounts 
  WHERE user_id = p_primary_user_id;
  
  -- Check if secondary user already has an identity group
  SELECT * INTO v_secondary_existing_link 
  FROM linked_accounts 
  WHERE user_id = p_secondary_user_id;
  
  -- If both users already have identity groups
  IF v_primary_existing_link.id IS NOT NULL AND v_secondary_existing_link.id IS NOT NULL THEN
    -- If they're already in the same group, nothing to do
    IF v_primary_existing_link.identity_group_id = v_secondary_existing_link.identity_group_id THEN
      RETURN jsonb_build_object('success', true, 'message', 'Users are already linked');
    END IF;
    
    -- Otherwise, merge the two groups - move all users from secondary group to primary group
    UPDATE linked_accounts
    SET identity_group_id = v_primary_existing_link.identity_group_id
    WHERE identity_group_id = v_secondary_existing_link.identity_group_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Identity groups merged');
  END IF;
  
  -- If primary user has a group but secondary doesn't
  IF v_primary_existing_link.id IS NOT NULL AND v_secondary_existing_link.id IS NULL THEN
    -- Add secondary user to primary's group
    INSERT INTO linked_accounts (identity_group_id, user_id)
    VALUES (v_primary_existing_link.identity_group_id, p_secondary_user_id);
    
    RETURN jsonb_build_object('success', true, 'message', 'Secondary user added to primary identity group');
  END IF;
  
  -- If secondary user has a group but primary doesn't
  IF v_primary_existing_link.id IS NULL AND v_secondary_existing_link.id IS NOT NULL THEN
    -- Add primary user to secondary's group
    INSERT INTO linked_accounts (identity_group_id, user_id)
    VALUES (v_secondary_existing_link.identity_group_id, p_primary_user_id);
    
    RETURN jsonb_build_object('success', true, 'message', 'Primary user added to secondary identity group');
  END IF;
  
  -- If neither user has a group, create a new one
  v_identity_group_id := gen_random_uuid();
  
  -- Add both users to the new group
  INSERT INTO linked_accounts (identity_group_id, user_id)
  VALUES 
    (v_identity_group_id, p_primary_user_id),
    (v_identity_group_id, p_secondary_user_id);
  
  RETURN jsonb_build_object('success', true, 'message', 'New identity group created with both users');
END;
$$;

-- Function to get all linked accounts for a user
CREATE OR REPLACE FUNCTION get_linked_accounts(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url
  FROM 
    linked_accounts la
  JOIN 
    linked_accounts my_la ON la.identity_group_id = my_la.identity_group_id
  JOIN 
    auth.users u ON la.user_id = u.id
  WHERE 
    my_la.user_id = p_user_id;
END;
$$;

-- Function to unlink a user account
CREATE OR REPLACE FUNCTION unlink_user_account(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link linked_accounts%ROWTYPE;
  v_count INTEGER;
BEGIN
  -- Find the link for this user
  SELECT * INTO v_link FROM linked_accounts WHERE user_id = p_user_id;
  
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not linked to any accounts');
  END IF;
  
  -- Count how many users are in this identity group
  SELECT COUNT(*) INTO v_count 
  FROM linked_accounts 
  WHERE identity_group_id = v_link.identity_group_id;
  
  -- Delete this user's link
  DELETE FROM linked_accounts WHERE user_id = p_user_id;
  
  -- If this was the last user in the group, nothing more to do
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'User unlinked', 
    'remaining_accounts', v_count - 1
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION link_user_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION get_linked_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION unlink_user_account TO authenticated;
