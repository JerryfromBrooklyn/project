import { Database } from './supabase';

export type Tables = Database['public']['Tables'];
export type UserRow = Tables['users']['Row'];
export type FaceDataRow = Tables['face_data']['Row'];
export type EventRow = Tables['events']['Row'];
export type ProfileRow = Tables['profiles']['Row'];

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface EventDetails {
  name: string;
  date: string;
  type?: string;
  promoter?: string;
}

export interface Venue {
  id?: string;
  name: string;
}

export interface FaceAttributes {
  age: {
    low: number;
    high: number;
  };
  smile: {
    value: boolean;
    confidence: number;
  };
  eyeglasses: {
    value: boolean;
    confidence: number;
  };
  sunglasses: {
    value: boolean;
    confidence: number;
  };
  gender: {
    value: string;
    confidence: number;
  };
  eyesOpen: {
    value: boolean;
    confidence: number;
  };
  mouthOpen: {
    value: boolean;
    confidence: number;
  };
  quality: {
    brightness: number;
    sharpness: number;
  };
  emotions: {
    type: string;
    confidence: number;
  }[];
  landmarks?: any[];
  pose?: any;
  beard?: {
    value: boolean;
    confidence: number;
  };
  mustache?: {
    value: boolean;
    confidence: number;
  };
  overallConfidence?: number;
}

export interface Face {
  userId: string;
  confidence: number;
  faceId?: string;
  attributes?: FaceAttributes;
}

export interface MatchedUser {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  confidence: number;
}

export interface FaceRegistrationData {
  userId: string;
  faceData: object;
}

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  folderPath?: string;
  photoId?: string;
  photoDetails?: PhotoMetadata;
}

export interface FolderStructure {
  [key: string]: {
    name: string;
    files: UploadItem[];
    subfolders: FolderStructure;
  };
}

export interface UploadMetadata {
  eventName: string;
  venueName: string;
  location: Location;
  promoterName: string;
  date: string;
}

export interface ViewMode {
  mode: 'grid' | 'list';
  sortBy: 'date' | 'name' | 'size';
}

export interface Filters {
  dateRange: {
    start: string;
    end: string;
  };
  location: Location;
  tags: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface PhotoMetadata {
  id: string;
  user_id?: string;
  uploaded_by?: string;
  uploadedBy?: string;
  url: string;
  eventId?: string;
  created_at: string;
  updated_at?: string;
  folderPath?: string;
  folderName?: string;
  fileSize: number;
  fileType: string;
  faces: Face[];
  title?: string;
  description?: string;
  location?: Location;
  venue?: Venue;
  tags?: string[];
  date_taken?: string;
  event_details?: EventDetails;
  matched_users?: MatchedUser[];
  labels?: any[];
  celebrities?: any[];
  moderationLabels?: any[];
}

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  photoId?: string;
  photoMetadata?: PhotoMetadata;
}

export interface BatchUpdateData {
  location?: Location;
  venue?: Venue;
  tags?: string[];
  date_taken?: string;
  event_details?: EventDetails;
}

export interface FaceSearchResult {
  userId: string;
  confidence: number;
  faceId: string;
}

export interface FaceIndexResult {
  success: boolean;
  faceId?: string;
  error?: string;
  attributes?: FaceAttributes;
}

export interface StorageUsage {
  total_size: number;
  quota_limit: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  metadata: {
    full_name?: string;
    avatar_url?: string;
    user_type?: string;
  };
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles?: UserProfile[];
}
