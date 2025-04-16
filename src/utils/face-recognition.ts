import { rekognitionClient } from '../config/aws-config';
import { 
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand
} from '@aws-sdk/client-rekognition';

export const detectFaces = async (imageBytes: Uint8Array) => {
  try {
    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes
      },
      Attributes: ['ALL']
    });

    const response = await rekognitionClient.send(command);
    return response.FaceDetails;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
};

export const indexFace = async (imageBytes: Uint8Array, collectionId: string) => {
  try {
    const command = new IndexFacesCommand({
      CollectionId: collectionId,
      Image: {
        Bytes: imageBytes
      },
      DetectionAttributes: ['ALL']
    });

    const response = await rekognitionClient.send(command);
    return response.FaceRecords;
  } catch (error) {
    console.error('Error indexing face:', error);
    throw error;
  }
};

export const searchFacesByImage = async (imageBytes: Uint8Array, collectionId: string) => {
  try {
    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: {
        Bytes: imageBytes
      },
      MaxFaces: 1000,
      FaceMatchThreshold: 95
    });

    const response = await rekognitionClient.send(command);
    return response.FaceMatches;
  } catch (error) {
    console.error('Error searching faces:', error);
    throw error;
  }
};