import AWS from 'aws-sdk';

/**
 * Configuration interface for AWS Rekognition Service
 */
export interface RekognitionConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  credentials?: AWS.Credentials;
}

/**
 * Face detection result interface
 */
export interface FaceDetectionResult {
  faces: AWS.Rekognition.FaceDetail[];
  orientationCorrection?: AWS.Rekognition.OrientationCorrection;
  error?: Error;
}

/**
 * Text detection result interface
 */
export interface TextDetectionResult {
  textDetections: AWS.Rekognition.TextDetection[];
  error?: Error;
}

/**
 * Object detection result interface
 */
export interface ObjectDetectionResult {
  labels: AWS.Rekognition.Label[];
  error?: Error;
}

/**
 * Rekognition service class for AWS Rekognition API integration
 */
export class RekognitionService {
  private rekognitionClient: AWS.Rekognition;
  private s3Client: AWS.S3;
  private bucketName: string;
  
  /**
   * Initialize the Rekognition service
   * @param config AWS configuration
   * @param bucketName S3 bucket name for image storage
   */
  constructor(config: RekognitionConfig, bucketName: string) {
    // Configure AWS
    if (config.credentials) {
      AWS.config.credentials = config.credentials;
    } else if (config.accessKeyId && config.secretAccessKey) {
      AWS.config.update({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      });
    }
    
    if (config.region) {
      AWS.config.update({ region: config.region });
    }
    
    // Initialize clients
    this.rekognitionClient = new AWS.Rekognition();
    this.s3Client = new AWS.S3();
    this.bucketName = bucketName;
  }
  
  /**
   * Upload an image to S3 bucket
   * @param file Image file to upload
   * @param key S3 object key (file path)
   * @returns Promise resolving to the S3 URL of the uploaded image
   */
  async uploadImageToS3(file: File, key?: string): Promise<string> {
    const fileName = key || `uploads/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        ACL: 'private',
      };
      
      const { Location } = await this.s3Client.upload(params).promise();
      return Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }
  
  /**
   * Detect faces in an image
   * @param imageSource S3 object or base64 encoded image
   * @returns Promise resolving to face detection results
   */
  async detectFaces(imageSource: { s3Object?: { bucket: string; name: string; }; bytes?: string | Uint8Array }): Promise<FaceDetectionResult> {
    try {
      const params: AWS.Rekognition.DetectFacesRequest = {
        Image: {},
        Attributes: ['ALL'],
      };
      
      if (imageSource.s3Object) {
        params.Image.S3Object = {
          Bucket: imageSource.s3Object.bucket || this.bucketName,
          Name: imageSource.s3Object.name,
        };
      } else if (imageSource.bytes) {
        params.Image.Bytes = typeof imageSource.bytes === 'string'
          ? Buffer.from(imageSource.bytes.replace(/^data:image\/\w+;base64,/, ''), 'base64')
          : imageSource.bytes;
      } else {
        throw new Error('Invalid image source. Provide either s3Object or bytes.');
      }
      
      const data = await this.rekognitionClient.detectFaces(params).promise();
      
      return {
        faces: data.FaceDetails || [],
        orientationCorrection: data.OrientationCorrection,
      };
    } catch (error) {
      console.error('Error detecting faces:', error);
      return {
        faces: [],
        error: error as Error,
      };
    }
  }
  
  /**
   * Detect text in an image
   * @param imageSource S3 object or base64 encoded image
   * @returns Promise resolving to text detection results
   */
  async detectText(imageSource: { s3Object?: { bucket: string; name: string; }; bytes?: string | Uint8Array }): Promise<TextDetectionResult> {
    try {
      const params: AWS.Rekognition.DetectTextRequest = {
        Image: {},
      };
      
      if (imageSource.s3Object) {
        params.Image.S3Object = {
          Bucket: imageSource.s3Object.bucket || this.bucketName,
          Name: imageSource.s3Object.name,
        };
      } else if (imageSource.bytes) {
        params.Image.Bytes = typeof imageSource.bytes === 'string'
          ? Buffer.from(imageSource.bytes.replace(/^data:image\/\w+;base64,/, ''), 'base64')
          : imageSource.bytes;
      } else {
        throw new Error('Invalid image source. Provide either s3Object or bytes.');
      }
      
      const data = await this.rekognitionClient.detectText(params).promise();
      
      return {
        textDetections: data.TextDetections || [],
      };
    } catch (error) {
      console.error('Error detecting text:', error);
      return {
        textDetections: [],
        error: error as Error,
      };
    }
  }
  
  /**
   * Detect objects and scenes in an image
   * @param imageSource S3 object or base64 encoded image
   * @param minConfidence Minimum confidence threshold (0-100)
   * @returns Promise resolving to object detection results
   */
  async detectLabels(imageSource: { s3Object?: { bucket: string; name: string; }; bytes?: string | Uint8Array }, minConfidence: number = 70): Promise<ObjectDetectionResult> {
    try {
      const params: AWS.Rekognition.DetectLabelsRequest = {
        Image: {},
        MaxLabels: 20,
        MinConfidence: minConfidence,
      };
      
      if (imageSource.s3Object) {
        params.Image.S3Object = {
          Bucket: imageSource.s3Object.bucket || this.bucketName,
          Name: imageSource.s3Object.name,
        };
      } else if (imageSource.bytes) {
        params.Image.Bytes = typeof imageSource.bytes === 'string'
          ? Buffer.from(imageSource.bytes.replace(/^data:image\/\w+;base64,/, ''), 'base64')
          : imageSource.bytes;
      } else {
        throw new Error('Invalid image source. Provide either s3Object or bytes.');
      }
      
      const data = await this.rekognitionClient.detectLabels(params).promise();
      
      return {
        labels: data.Labels || [],
      };
    } catch (error) {
      console.error('Error detecting labels:', error);
      return {
        labels: [],
        error: error as Error,
      };
    }
  }
  
  /**
   * Compare two faces for similarity
   * @param sourceImage Source image (face to compare from)
   * @param targetImage Target image (face to compare to)
   * @param similarityThreshold Similarity threshold (0-100)
   * @returns Promise resolving to face comparison results
   */
  async compareFaces(
    sourceImage: { s3Object?: { bucket: string; name: string; }; bytes?: string | Uint8Array },
    targetImage: { s3Object?: { bucket: string; name: string; }; bytes?: string | Uint8Array },
    similarityThreshold: number = 90
  ): Promise<AWS.Rekognition.CompareFacesResponse> {
    const params: AWS.Rekognition.CompareFacesRequest = {
      SourceImage: {},
      TargetImage: {},
      SimilarityThreshold: similarityThreshold,
    };
    
    // Set source image
    if (sourceImage.s3Object) {
      params.SourceImage.S3Object = {
        Bucket: sourceImage.s3Object.bucket || this.bucketName,
        Name: sourceImage.s3Object.name,
      };
    } else if (sourceImage.bytes) {
      params.SourceImage.Bytes = typeof sourceImage.bytes === 'string'
        ? Buffer.from(sourceImage.bytes.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        : sourceImage.bytes;
    } else {
      throw new Error('Invalid source image. Provide either s3Object or bytes.');
    }
    
    // Set target image
    if (targetImage.s3Object) {
      params.TargetImage.S3Object = {
        Bucket: targetImage.s3Object.bucket || this.bucketName,
        Name: targetImage.s3Object.name,
      };
    } else if (targetImage.bytes) {
      params.TargetImage.Bytes = typeof targetImage.bytes === 'string'
        ? Buffer.from(targetImage.bytes.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        : targetImage.bytes;
    } else {
      throw new Error('Invalid target image. Provide either s3Object or bytes.');
    }
    
    try {
      return await this.rekognitionClient.compareFaces(params).promise();
    } catch (error) {
      console.error('Error comparing faces:', error);
      throw error;
    }
  }
  
  /**
   * Create a mock client for testing
   * @returns RekognitionService with mock implementation
   */
  static createMockClient(): RekognitionService {
    // Create a service with empty config and bucket
    const service = new RekognitionService({}, 'mock-bucket');
    
    // Override methods with mock implementations
    service.detectFaces = async () => ({
      faces: [
        {
          BoundingBox: {
            Width: 0.5,
            Height: 0.5,
            Left: 0.25,
            Top: 0.25,
          },
          Confidence: 99.9,
          Landmarks: [],
          Pose: {
            Roll: 0,
            Yaw: 0,
            Pitch: 0,
          },
          Quality: {
            Brightness: 50,
            Sharpness: 50,
          },
        },
      ],
    });
    
    service.detectText = async () => ({
      textDetections: [
        {
          DetectedText: 'Sample Text',
          Type: 'LINE',
          Id: 0,
          Confidence: 99.5,
          Geometry: {
            BoundingBox: {
              Width: 0.5,
              Height: 0.1,
              Left: 0.25,
              Top: 0.25,
            },
            Polygon: [],
          },
        },
      ],
    });
    
    service.detectLabels = async () => ({
      labels: [
        {
          Name: 'Person',
          Confidence: 99.8,
        },
        {
          Name: 'Outdoors',
          Confidence: 95.2,
        },
      ],
    });
    
    service.compareFaces = async () => ({
      SourceImageFace: {
        BoundingBox: {
          Width: 0.5,
          Height: 0.5,
          Left: 0.25,
          Top: 0.25,
        },
        Confidence: 99.9,
      },
      FaceMatches: [
        {
          Similarity: 98.5,
          Face: {
            BoundingBox: {
              Width: 0.5,
              Height: 0.5,
              Left: 0.25,
              Top: 0.25,
            },
            Confidence: 99.9,
          },
        },
      ],
      UnmatchedFaces: [],
    });
    
    return service;
  }
}

// Export a factory function to create the service
export const createRekognitionService = (config: RekognitionConfig, bucketName: string) => {
  return new RekognitionService(config, bucketName);
}; 