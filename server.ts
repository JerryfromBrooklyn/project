import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Import our face matching service (adjust path if needed)
import * as faceMatchingService from './src/services/faceMatchingService';
// We will create databaseService later
// import * as databaseService from './src/services/databaseService';

dotenv.config(); // Load environment variables from .env file

const app: Express = express();
const port = process.env.PORT || 3000;

// === Middleware ===
app.use(cors()); // Allow requests from our frontend development server
app.use(express.json({ limit: '10mb' })); // Allow server to read JSON data from requests (e.g., user info), limit needed for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Allow server to read data from forms

// === API Endpoints (Doors/Windows) - Stubs for now ===

// Basic check to see if the server is running
app.get('/', (req: Request, res: Response) => {
  res.send('Shmong Backend is Running!');
});

// --- TODO: Phase 2 Endpoints ---
app.post('/api/register', async (req: Request, res: Response) => {
    console.log("Received request for /api/register");
    // TODO: Get email, password, image data from req.body
    // TODO: Basic validation
    // TODO: Hash password
    // TODO: Create user in Users table (using databaseService)
    // TODO: Call faceMatchingService.indexFaceForRegistration
    // TODO: Save canonicalFaceId to user record (using databaseService)
    // TODO: Call faceMatchingService.searchFacesByFaceId
    // TODO: Link matches in DetectedFaces table (using databaseService)
    res.status(501).json({ message: 'Registration endpoint not implemented yet.' });
});

app.post('/api/login', async (req: Request, res: Response) => {
    console.log("Received request for /api/login");
    // TODO: Get email, password from req.body
    // TODO: Find user in DB
    // TODO: Compare password hash
    // TODO: Generate JWT token or session
    res.status(501).json({ message: 'Login endpoint not implemented yet.' });
});

app.get('/api/my-photos', async (req: Request, res: Response) => {
    console.log("Received request for /api/my-photos");
    // TODO: Get userId from authenticated request (e.g., JWT token)
    // TODO: Query DetectedFaces for userId (using databaseService)
    // TODO: Get distinct photoIds
    // TODO: Query Photos table for photo details (URLs) (using databaseService)
    res.status(501).json({ message: 'My Photos endpoint not implemented yet.' });
});

// --- TODO: Phase 3 Endpoints ---
app.post('/api/upload-photo', async (req: Request, res: Response) => {
    console.log("Received request for /api/upload-photo");
    // TODO: Handle file upload (e.g., using multer middleware if not direct to S3)
    // TODO: Save photo metadata (URL) to Photos table (using databaseService)
    // TODO: Get image bytes (from upload or S3)
    // TODO: Call faceMatchingService.processUploadedPhotoForIndexingAndMatching
    res.status(501).json({ message: 'Upload Photo endpoint not implemented yet.' });
});


// === Start the Server ===
app.listen(port, () => {
  console.log(`⚡️[server]: Backend server is running at http://localhost:${port}`);
}); 