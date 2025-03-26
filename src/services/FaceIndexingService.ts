import { rekognitionClient, COLLECTION_ID } from '../config/aws-config';
import { 
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  ListCollectionsCommand,
  DeleteCollectionCommand,
  CreateCollectionCommand
} from '@aws-sdk/client-rekognition';
import { FACE_MATCH_THRESHOLD } from '../config/aws-config';
import { supabase } from '../lib/supabaseClient';

export interface FaceSearchResult {
  userId: string;
  confidence: number;
  faceId: string;
}

export interface FaceIndexResult {
  success: boolean;
  faceId?: string;
  error?: string;
  attributes?: any;
}

interface BackgroundTask {
  id: string;
  type: 'FACE_REGISTRATION' | 'PHOTO_MATCHING';
  userId: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FaceIndexingService {
  private static COLLECTION_ID = COLLECTION_ID;
  private static MAX_RETRIES = 1;
  private static RETRY_DELAY = 2000;
  private static BATCH_SIZE = 20;
  private static CACHE_TTL = 30 * 60 * 1000; // 1 hour
  private static BACKGROUND_INTERVAL = 10000; // 5 seconds

  private static matchCache = new Map<string, { result: FaceSearchResult[]; timestamp: number }>();
  private static backgroundTasks: BackgroundTask[] = [];
  private static isProcessing = false;

  public static async indexFace(imageBytes: Uint8Array, userId: string): Promise<FaceIndexResult> {
    try {
      console.group('Face Indexing Process');
      console.log('🔍 Starting face indexing...');

      console.log('Step 1: Detecting faces in image...');
      const detectedFaces = await this.detectFacesWithRetry(imageBytes);
      
      if (!detectedFaces || detectedFaces.length === 0) {
        console.warn('❌ No faces detected in image');
        console.groupEnd();
        return {
          success: false,
          error: 'No faces detected in image'
        };
      }

      if (detectedFaces.length > 1) {
        console.warn('❌ Multiple faces detected in image');
        console.groupEnd();
        return {
          success: false,
          error: 'Only one face can be registered at a time'
        };
      }

      console.log('Step 2: Indexing face...');
      const command = new IndexFacesCommand({
        CollectionId: this.COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: userId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'AUTO'
      });

      const response = await rekognitionClient.send(command);

      if (!response.FaceRecords || response.FaceRecords.length === 0) {
        console.warn('❌ No faces indexed');
        console.groupEnd();
        return {
          success: false,
          error: 'Failed to index face'
        };
      }

      const faceRecord = response.FaceRecords[0];
      console.log('✅ Face indexed successfully:', faceRecord.Face?.FaceId);
      console.log('Face attributes:', faceRecord.FaceDetail);

      this.addBackgroundTask({
        type: 'PHOTO_MATCHING',
        userId,
        data: { faceId: faceRecord.Face?.FaceId }
      });

      console.groupEnd();
      return {
        success: true,
        faceId: faceRecord.Face?.FaceId,
        attributes: faceRecord.FaceDetail
      };
    } catch (error) {
      console.error('❌ Error indexing face:', error);
      console.groupEnd();
      return {
        success: false,
        error: (error as Error).message || 'Failed to index face'
      };
    }
  }

  public static async startBackgroundProcessing() {
    setInterval(async () => {
      if (!FaceIndexingService.isProcessing && FaceIndexingService.backgroundTasks.length > 0) {
        await FaceIndexingService.processBackgroundTasks();
      }
    }, FaceIndexingService.BACKGROUND_INTERVAL);
  }

  private static async processBackgroundTasks() {
    if (FaceIndexingService.backgroundTasks.length === 0) return;

    FaceIndexingService.isProcessing = true;
    console.log('Processing background tasks:', FaceIndexingService.backgroundTasks.length);

    try {
      const task = FaceIndexingService.backgroundTasks[0];
      task.status = 'processing';
      task.updatedAt = new Date();

      switch (task.type) {
        case 'FACE_REGISTRATION':
          await this.processFaceRegistration(task);
          break;
        case 'PHOTO_MATCHING':
          await this.processPhotoMatching(task);
          break;
      }

      FaceIndexingService.backgroundTasks.shift();
    } catch (error) {
      console.error('Error processing background task:', error);
    } finally {
      FaceIndexingService.isProcessing = false;
    }
  }

  private static async processFaceRegistration(task: BackgroundTask) {
    console.group('Processing Face Registration');
    try {
      const { imageBytes, userId } = task.data;

      const command = new IndexFacesCommand({
        CollectionId: FaceIndexingService.COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: userId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1,
        QualityFilter: 'AUTO'
      });

      const response = await rekognitionClient.send(command);

      if (!response.FaceRecords?.length) {
        throw new Error('Failed to add face to collection');
      }

      this.addBackgroundTask({
        type: 'PHOTO_MATCHING',
        userId,
        data: { faceId: response.FaceRecords[0].Face?.FaceId }
      });

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      console.error('Face registration failed:', error);
    } finally {
      console.groupEnd();
    }
  }

  private static async processPhotoMatching(task: BackgroundTask) {
    console.group('Processing Photo Matching');
    try {
      const { data: photos } = await supabase
        .from('photos')
        .select('*');

      if (!photos?.length) {
        console.log('No photos found to process');
        task.status = 'completed';
        return;
      }

      console.log(`Processing ${photos.length} photos for face matches`);

      for (let i = 0; i < photos.length; i += FaceIndexingService.BATCH_SIZE) {
        const batch = photos.slice(i, i + FaceIndexingService.BATCH_SIZE);
        
        await Promise.all(batch.map(async (photo) => {
          try {
            const { data: imageData } = await supabase.storage
              .from('photos')
              .download(photo.storage_path);

            if (!imageData) return;

            const matches = await this.searchFaces(new Uint8Array(await imageData.arrayBuffer()));

            if (matches.length > 0) {
              const existingMatches = photo.matched_users || [];
              
              const newMatches = matches
                .filter(match => !existingMatches.some(existing => existing.userId === match.userId))
                .map(match => ({
                  userId: match.userId,
                  confidence: match.confidence
                }));

              const updatedMatches = [...existingMatches, ...newMatches];

              await supabase
                .from('photos')
                .update({
                  matched_users: updatedMatches
                })
                .eq('id', photo.id);

              console.log(`Updated matches for photo ${photo.id}:`, {
                existing: existingMatches.length,
                new: newMatches.length,
                total: updatedMatches.length
              });
            }
          } catch (error) {
            console.error(`Error processing photo ${photo.id}:`, error);
          }
        }));
      }

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      console.error('Photo matching failed:', error);
    } finally {
      console.groupEnd();
    }
  }

  private static addBackgroundTask(task: Partial<BackgroundTask>) {
    const newTask: BackgroundTask = {
      id: crypto.randomUUID(),
      type: task.type!,
      userId: task.userId!,
      data: task.data || {},
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    FaceIndexingService.backgroundTasks.push(newTask);
    console.log('Added background task:', newTask.type);
  }

  private static createCacheKey(imageBytes: Uint8Array): string {
    return Array.from(imageBytes.slice(0, 1000))
      .reduce((acc, byte) => acc + byte, 0)
      .toString(36);
  }

  public static async searchFaces(imageBytes: Uint8Array): Promise<FaceSearchResult[]> {
    try {
      console.group('Face Search Process');
      console.log('🔍 Starting face search process...');
      
      const detectedFaces = await this.detectFacesWithRetry(imageBytes);
      
      if (!detectedFaces || detectedFaces.length === 0) {
        console.warn('❌ No faces detected in image during search');
        console.groupEnd();
        return [];
      }

      console.log(`✅ Detected ${detectedFaces.length} faces in image`);
      console.log('Face details:', detectedFaces);

      const cacheKey = this.createCacheKey(imageBytes);
      console.log('Generated cache key:', cacheKey);
      
      const cached = FaceIndexingService.matchCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < FaceIndexingService.CACHE_TTL) {
        console.log('🔄 Returning cached face matches:', cached.result);
        console.groupEnd();
        return cached.result;
      }

      console.log('Step 2: Searching for face matches in collection...');
      const command = new SearchFacesByImageCommand({
        CollectionId: FaceIndexingService.COLLECTION_ID,
        Image: { Bytes: imageBytes },
        MaxFaces: 5,
        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
        QualityFilter: 'NONE'
      });

      const response = await rekognitionClient.send(command);
      
      if (!response.FaceMatches?.length) {
        console.warn('❌ No face matches found in collection');
        console.groupEnd();
        return [];
      }

      console.log(`✅ Found ${response.FaceMatches.length} potential matches`);
      console.log('Raw matches:', response.FaceMatches);

      console.log('Step 3: Processing matches...');
      const results = response.FaceMatches
        .map(match => {
          const result = {
            userId: match.Face?.ExternalImageId || '',
            confidence: match.Similarity || 0,
            faceId: match.Face?.FaceId || ''
          };
          console.log(`Match processed: User ${result.userId} with ${result.confidence.toFixed(2)}% confidence`);
          return result;
        })
        .filter(result => {
          const passes = result.confidence >= FACE_MATCH_THRESHOLD;
          if (!passes) {
            console.log(`Match filtered out: ${result.confidence.toFixed(2)}% < ${FACE_MATCH_THRESHOLD}% threshold`);
          }
          return passes;
        });

      console.log(`✅ Final results: ${results.length} valid matches above ${FACE_MATCH_THRESHOLD}% threshold`);
      console.log('Processed results:', results);

      FaceIndexingService.matchCache.set(cacheKey, {
        result: results,
        timestamp: Date.now()
      });
      console.log('Cache updated with new results');

      console.groupEnd();
      return results;
    } catch (error) {
      console.error('❌ Error during face search:', error);
      console.groupEnd();
      return [];
    }
  }

  private static async detectFacesWithRetry(imageBytes: Uint8Array) {
    let retries = 0;
    let lastError;
    
    while (retries < FaceIndexingService.MAX_RETRIES) {
      try {
        console.log(`Attempt ${retries + 1} to detect faces...`);
        
        const command = new DetectFacesCommand({
          Image: { Bytes: imageBytes },
          Attributes: ['ALL']
        });
        
        const response = await rekognitionClient.send(command);
        
        if (!response.FaceDetails || response.FaceDetails.length === 0) {
          console.log('No faces detected in image');
          return [];
        }

        console.log(`Successfully detected ${response.FaceDetails.length} faces`);
        return response.FaceDetails;
      } catch (error) {
        console.error(`Face detection attempt ${retries + 1} failed:`, error);
        lastError = error;
        retries++;
        
        if (retries < FaceIndexingService.MAX_RETRIES) {
          const delay = FaceIndexingService.RETRY_DELAY * retries;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed to detect faces after all retries');
  }

  public static async initialize(): Promise<boolean> {
    try {
      console.group('Face Collection Initialization');
      console.log('🔄 Initializing face collection...');
      
      const listCollections = await rekognitionClient.send(
        new ListCollectionsCommand({})
      );

      const collectionExists = listCollections.CollectionIds?.includes(FaceIndexingService.COLLECTION_ID);

      if (!collectionExists) {
        console.log('Creating new face collection...');
        await rekognitionClient.send(
          new CreateCollectionCommand({
            CollectionId: FaceIndexingService.COLLECTION_ID,
            Tags: {
              Environment: 'production',
              Application: 'shmong'
            }
          })
        );
        console.log('✅ Face collection created successfully');
      } else {
        console.log('✅ Face collection already exists');
      }

      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Error initializing face collection:', error);
      console.groupEnd();
      return false;
    }
  }

  public static async resetCollection(): Promise<boolean> {
    try {
      console.group('Face Collection Reset');
      console.log('🔄 Resetting face collection...');

      try {
        console.log('Deleting existing collection...');
        await rekognitionClient.send(
          new DeleteCollectionCommand({
            CollectionId: FaceIndexingService.COLLECTION_ID
          })
        );
        console.log('✅ Existing collection deleted');
      } catch (error) {
        console.log('No existing collection to delete');
      }

      console.log('Creating new collection...');
      await rekognitionClient.send(
        new CreateCollectionCommand({
          CollectionId: FaceIndexingService.COLLECTION_ID,
          Tags: {
            Environment: 'production',
            Application: 'shmong'
          }
        })
      );
      console.log('✅ New collection created');

      console.log('✅ Collection reset complete');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Error resetting collection:', error);
      console.groupEnd();
      return false;
    }
  }
}

FaceIndexingService.startBackgroundProcessing();
FaceIndexingService.initialize().catch(console.error);

export default FaceIndexingService;
