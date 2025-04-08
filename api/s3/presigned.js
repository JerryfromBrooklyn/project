import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType, userId, metaData } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and contentType are required' });
    }

    // Generate a unique key for S3
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Create a structured path for the object
    const userPrefix = userId ? `user/${userId}` : 'anonymous';
    const datePrefix = `${year}/${month}/${day}`;
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    // Clean the filename to prevent path traversal and other issues
    const cleanFilename = filename.replace(/[^\w\d.-]/g, '_');
    
    // Construct the final S3 key
    const key = `${userPrefix}/${datePrefix}/${uniqueId}-${cleanFilename}`;
    
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    // Create a command for putting an object
    const putObjectParams = {
      Bucket: process.env.S3_BUCKET || 'shmong',
      Key: key,
      ContentType: contentType,
      Metadata: {
        userId: userId || 'anonymous',
        uploadTime: new Date().toISOString(),
        ...metaData
      }
    };
    
    const command = new PutObjectCommand(putObjectParams);
    
    // Generate presigned URL (valid for 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    return res.status(200).json({
      success: true,
      url: presignedUrl,
      bucket: process.env.S3_BUCKET || 'shmong',
      key: key,
      // Include fields that would be sent with multipart/form-data uploads
      fields: {
        acl: 'public-read',
        key: key,
        'Content-Type': contentType
      }
    });
    
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Failed to generate presigned URL', details: error.message });
  }
} 