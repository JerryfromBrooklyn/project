import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RekognitionClient, DetectFacesCommand } from 'npm:@aws-sdk/client-rekognition'

// Environment variables (set these in Supabase dashboard)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'
const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID') || ''
const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''

// Set up Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey
  }
})

// Define the shape of a safe response
interface SafeFaceResponse {
  success: boolean
  message: string
  faceCount: number
  faces: any[]
  error?: any
}

// Helper function to create safe empty response
function createSafeResponse(message: string, error: any = null): SafeFaceResponse {
  return {
    success: false,
    message,
    faceCount: 0,
    faces: [],
    error: error ? String(error) : undefined
  }
}

serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json'
    }

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify(createSafeResponse('Method not allowed. Use POST.')),
        { headers, status: 405 }
      )
    }

    // Parse the request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify(createSafeResponse('Invalid JSON body', e)),
        { headers, status: 400 }
      )
    }

    // Check if imageData or path is provided
    if (!body.imageData && !body.storagePath) {
      return new Response(
        JSON.stringify(createSafeResponse('Missing required parameter: provide either imageData or storagePath')),
        { headers, status: 400 }
      )
    }

    // Initialize image bytes variable
    let imageBytes: Uint8Array | null = null

    // If image data is provided directly
    if (body.imageData) {
      try {
        // Convert base64 to binary
        const base64Data = body.imageData.replace(/^data:image\/\w+;base64,/, '')
        imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      } catch (error) {
        return new Response(
          JSON.stringify(createSafeResponse('Invalid image data format', error)),
          { headers, status: 400 }
        )
      }
    } 
    // If storage path is provided, fetch from Supabase storage
    else if (body.storagePath) {
      try {
        const { bucket = 'photos', path } = parseStoragePath(body.storagePath)
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(path)
        
        if (error || !data) {
          throw error || new Error('No data returned from storage')
        }
        
        // Convert blob to Uint8Array
        imageBytes = new Uint8Array(await data.arrayBuffer())
      } catch (error) {
        return new Response(
          JSON.stringify(createSafeResponse(`Failed to download image from storage: ${body.storagePath}`, error)),
          { headers, status: 500 }
        )
      }
    }

    // Make sure we have image bytes to process
    if (!imageBytes || imageBytes.length === 0) {
      return new Response(
        JSON.stringify(createSafeResponse('No valid image data available')),
        { headers, status: 400 }
      )
    }

    // Try to detect faces using AWS Rekognition
    try {
      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBytes
        },
        Attributes: ['ALL']
      })

      const response = await rekognitionClient.send(command)
      
      // Create a safe response even if AWS succeeds
      const result: SafeFaceResponse = {
        success: true,
        message: 'Faces detected successfully',
        faceCount: response.FaceDetails?.length || 0,
        faces: response.FaceDetails || []
      }

      return new Response(
        JSON.stringify(result),
        { headers, status: 200 }
      )
    } catch (error) {
      console.error('AWS Rekognition error:', error)
      
      // Return a safe default response when AWS fails
      return new Response(
        JSON.stringify(createSafeResponse('Face detection failed, returning safe default', error)),
        { headers, status: 200 } // Still return 200 to not break client
      )
    }
  } catch (error) {
    // Catch any other unexpected errors
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify(createSafeResponse('Unexpected error in face detection service', error)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to parse storage path
function parseStoragePath(path: string): { bucket: string, path: string } {
  // Default to 'photos' bucket
  let bucket = 'photos'
  let storagePath = path
  
  // Check if path includes bucket reference (e.g., "bucket/path/to/file.jpg")
  if (path.includes('/')) {
    const parts = path.split('/')
    if (parts.length > 1) {
      bucket = parts[0]
      storagePath = parts.slice(1).join('/')
    }
  }
  
  return { bucket, path: storagePath }
} 