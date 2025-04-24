-- SQL Script to fix user face data
-- Run this in the Supabase SQL Editor

-- 1. Update the user's face_id directly
UPDATE public.users
SET 
  face_id = 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8'
WHERE 
  id = 'a109c673-452f-4727-b108-6aa06b7a46fc';

-- 2. Remove existing entry in user_faces table if it exists
DELETE FROM public.user_faces
WHERE 
  user_id = 'a109c673-452f-4727-b108-6aa06b7a46fc' AND 
  face_id = 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8';

-- 3. Add new entry to user_faces
INSERT INTO public.user_faces (user_id, face_id)
VALUES ('a109c673-452f-4727-b108-6aa06b7a46fc', 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8');

-- 4. Check if the update worked
SELECT id, face_id, face_updated_at 
FROM public.users 
WHERE id = 'a109c673-452f-4727-b108-6aa06b7a46fc';

-- 5. Check user_faces entry
SELECT * FROM public.user_faces
WHERE 
  user_id = 'a109c673-452f-4727-b108-6aa06b7a46fc' AND 
  face_id = 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8'; 