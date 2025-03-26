import { FaceIndexingService } from '../src/services/FaceIndexingService';

async function reindexFaces() {
  try {
    console.log('Starting face reindexing process...');
    
    // Reset collection to ensure clean state
    console.log('Resetting collection...');
    await FaceIndexingService.resetCollection().catch(error => {
      console.error('Error resetting collection:', error);
      throw error;
    });
    
    // Reindex all faces
    console.log('Reindexing all faces...');
    await FaceIndexingService.reindexAllFaces().catch(error => {
      console.error('Error reindexing faces:', error);
      throw error;
    });
    
    console.log('Face reindexing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during face reindexing:', error);
    process.exit(1);
  }
}

reindexFaces();