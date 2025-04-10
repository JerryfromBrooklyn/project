import { RekognitionClient, IndexFacesCommand, SearchFacesCommand } from "@aws-sdk/client-rekognition";
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, PHOTOS_TABLE } from '../lib/awsClient';
import { getFaceDataForUser } from './FaceStorageService'; 