// src/types.ts

// Represents the structure returned by Rekognition's DetectFaces/IndexFaces with ALL attributes
export interface RekognitionFaceDetails {
  BoundingBox?: { Width?: number; Height?: number; Left?: number; Top?: number };
  AgeRange?: { Low?: number; High?: number };
  Smile?: { Value?: boolean; Confidence?: number };
  Eyeglasses?: { Value?: boolean; Confidence?: number };
  Sunglasses?: { Value?: boolean; Confidence?: number };
  Gender?: { Value?: 'Male' | 'Female'; Confidence?: number };
  Beard?: { Value?: boolean; Confidence?: number };
  Mustache?: { Value?: boolean; Confidence?: number };
  EyesOpen?: { Value?: boolean; Confidence?: number };
  MouthOpen?: { Value?: boolean; Confidence?: number };
  Emotions?: Array<{ Type?: string; Confidence?: number }>; // Array of emotions
  Landmarks?: Array<{ Type?: string; X?: number; Y?: number }>;
  Pose?: { Roll?: number; Yaw?: number; Pitch?: number };
  Quality?: { Brightness?: number; Sharpness?: number };
  Confidence?: number;
  FaceOccluded?: { Value?: boolean; Confidence?: number };
  EyeDirection?: { Yaw?: number; Pitch?: number; Confidence?: number };
  // Other attributes might exist depending on Rekognition model version
}

// Represents the face data *as stored in our database* (e.g., DetectedFaces table or photo.faces array)
export interface FaceData {
  id?: string; // e.g., anonymousRekognitionFaceId
  boundingBox?: { Width?: number; Height?: number; Left?: number; Top?: number };
  confidence: number;
  attributes?: Partial<RekognitionFaceDetails>; // Store the Rekognition details, maybe selectively
}


// Represents a user matched to a photo
export interface MatchedUser {
  userId: string;
  faceId: string; // The canonical face ID of the user
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  confidence: number; // Match confidence
  similarity?: number; // Rekognition similarity score
  matched_at?: string;
}

// Represents the overall photo metadata, potentially combining DB and other sources
export interface PhotoMetadata {
  id: string;
  url: string;
  eventId?: string | null;
  uploadedBy?: string | null;
  created_at: string;
  folderPath?: string | null;
  folderName?: string | null;
  fileSize: number;
  fileType: string;
  faces: FaceData[]; // Array of detected/indexed faces in this photo
  title?: string | null;
  description?: string | null;
  location?: { lat: number | null; lng: number | null; name: string | null };
  venue?: { id: string | null; name: string | null };
  tags?: string[] | null;
  date_taken?: string | null;
  event_details?: { 
    date: string | null; 
    name: string | null; 
    type: string | null; 
    promoter: string | null 
  } | null;
  matched_users: MatchedUser[]; // Array of users matched in this photo
}

// Type for user profile data from Supabase/DB
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  // Add other fields like created_at, etc.
}

// Represents Supabase User type (subset we often need)
export interface AuthUser {
  id: string;
  email?: string;
  // Supabase might store metadata here, adjust based on actual structure
  user_metadata?: { 
    name?: string; 
    full_name?: string; 
    avatar_url?: string; 
    // other custom fields?
  };
  app_metadata?: any;
  // other properties from Supabase auth user...
}

// Represents the state of an individual file upload
export interface UploadItem {
  id: string; // Unique ID for the upload item (e.g., Uppy file ID)
  file: File;
  status: 'queued' | 'uploading' | 'processing' | 'complete' | 'error' | 'pending';
  progress: number; // 0-100
  error?: string | null;
  previewUrl?: string; // For image previews
  photoId?: string | null; // ID assigned after successful DB record creation
  s3Url?: string | null; // URL after successful S3 upload
  folderPath?: string;
  photoDetails?: Partial<PhotoMetadata>;
} 