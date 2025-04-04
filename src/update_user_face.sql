-- Update the user's face_id directly
UPDATE public.users
SET 
  face_id = 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8'
WHERE 
  id = 'a109c673-452f-4727-b108-6aa06b7a46fc';

-- Also verify the entry in user_faces table
INSERT INTO public.user_faces (user_id, face_id)
VALUES ('a109c673-452f-4727-b108-6aa06b7a46fc', 'afb1b2ca-977b-4e3c-b712-7b6a38c3a6f8')
ON CONFLICT (user_id, face_id) DO NOTHING;

-- Check for existing record in face_data
SELECT EXISTS (
  SELECT 1 FROM public.face_data
  WHERE user_id = 'a109c673-452f-4727-b108-6aa06b7a46fc'
) as face_data_exists; 