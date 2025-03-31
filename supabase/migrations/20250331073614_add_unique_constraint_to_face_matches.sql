-- Add unique constraint for ON CONFLICT
ALTER TABLE face_matches
ADD CONSTRAINT face_matches_face_pair_unique UNIQUE (face_id, matched_face_id);
