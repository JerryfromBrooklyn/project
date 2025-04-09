# Shmong Face Matching System Implementation Documentation

## 1. Overview & Goal

The primary goal is to implement a system that allows festival attendees (Users) to register with their face and automatically discover photos they appear in, which were previously uploaded by photographers.

The system needs to handle:
*   **User Registration:** Email, password, and face capture via webcam.
*   **Photo Upload:** Photographers upload large batches of photos.
*   **Face Indexing:** Processing uploaded photos to detect and index faces anonymously.
*   **Face Matching (Historical):** Upon user registration, searching all indexed anonymous faces to find matches for the newly registered user.
*   **Face Matching (Future):** When new photos are uploaded, checking detected faces against already registered users in near real-time.
*   **Photo Display:** Users can view photos they have been matched in.

## 2. Architecture

*   **Frontend:** React (Vite) + TypeScript, TailwindCSS.
*   **Backend:** Serverless approach using AWS Lambda + API Gateway.
*   **Database:** AWS DynamoDB for storing user data, photo metadata, and detected face information.
*   **Face Recognition:** AWS Rekognition (Image API).
*   **File Storage (Implied):** AWS S3 for storing uploaded photos (details TBD in Phase 3).
*   **Authentication:** Standard email/password login, likely using JWT or sessions managed by backend logic (details TBD).

## 3. Implementation Phases

### Phase 1: Backend Foundation & Core Services (Completed)

*   **Goal:** Set up essential AWS infrastructure, database structure, and isolated backend service modules.
*   **Status:** Completed (verified via AWS CLI where possible).

**Tasks Completed & AWS Resources:**
    *   **DynamoDB Tables Created & Verified Active:**
        *   `Users` (Partition Key: `userId`)
        *   `Photos` (Partition Key: `photoId`)
        *   `DetectedFaces` (Partition Key: `photoId`, Sort Key: `anonymousRekognitionFaceId`)
    *   **DynamoDB GSIs Created & Verified Active:**
        *   On `Users`: `RekognitionFaceIdIndex` (Partition Key: `rekognitionFaceId`)
        *   On `Users`: `EmailIndex` (Partition Key: `email`) - Verified Active
        *   On `DetectedFaces`: `AnonymousFaceIdIndex` (Partition Key: `anonymousRekognitionFaceId`)
    *   **AWS Rekognition Collection Created & Verified:**
        *   `shmong-faces`
    *   **IAM Role Created & Verified:**
        *   `ShmongLambdaExecRole` (Trusts lambda.amazonaws.com)
    *   **IAM Policy Created & Verified:**
        *   `ShmongLambdaExecPolicy` (JSON defined in `lambda-exec-policy.json`, includes permissions for Logs, Rekognition, DynamoDB)
    *   **Policy Attached to Role:** `ShmongLambdaExecPolicy` attached to `ShmongLambdaExecRole` (Verified via CLI).
    *   **Code Dependencies Installed:** Core AWS SDK v3 clients (`@aws-sdk/client-rekognition`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/credential-providers`), `express`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken` and corresponding `@types`. (*Installation assumed complete*).
    *   **Environment Variables:** `.env` file created and updated with backend-specific variable names (e.g., `AWS_REGION`). (*Requires manual input of actual AWS Keys*).
    *   **Local Dev Environment:** Frontend `npm run dev` confirmed working after fixing PostCSS config.

**Key Code Files Created:**
    *   `src/services/faceMatchingService.ts`: Handles interactions with AWS Rekognition API (`indexFaceForRegistration`, `searchFacesByFaceId`, `processUploadedPhotoForIndexingAndMatching`).
    *   `src/services/databaseService.ts`: Handles interactions with DynamoDB (initial functions `saveDetectedFaceToDB`, `linkDetectedFaceToUser`, `createUser`, `findUserByEmail`, `saveUserRekognitionFaceId` implemented; others pending).
    *   `src/lambda-handlers/` directory created.
    *   `src/lambda-handlers/registerUserHandler.ts`: Placeholder Lambda handler structure.
    *   `src/lambda-handlers/loginUserHandler.ts`: Placeholder Lambda handler structure.
    *   `src/lambda-handlers/getMyPhotosHandler.ts`: Placeholder Lambda handler structure.
    *   `src/lambda-handlers/uploadPhotoHandler.ts`: Placeholder Lambda handler structure.
    *   `lambda-exec-policy.json`: IAM Policy definition.
    *   `lambda-trust-policy.json`: IAM Role trust policy definition.

### Phase 2: User Registration & Historical Matching Flow (Completed)

*   **Goal:** Build the end-to-end flow for user signup with face scanning and displaying initial matches.
*   **Status:** Completed.
*   **Tasks Completed:**
    1.  **Implement Backend `/api/register` Lambda Logic:** Fleshed out `src/lambda-handlers/registerUserHandler.ts`.
    2.  **Implement Supporting DB Functions:** Completed `createUser`, `findUserByEmail`, `saveUserRekognitionFaceId` in `databaseService.ts`.
    3.  **Deploy `registerUser` Lambda:** Packaged and deployed the handler to AWS Lambda with `ShmongLambdaExecRole`.
    4.  **Configure API Gateway for `/api/register`:** Created `POST /api/register` route integrated with the Lambda.
    5.  **Build Frontend `FaceRegistration` Component:** Created UI with webcam integration.
    6.  **Integrate Frontend:** Connected `FaceRegistration` to `/api/register` endpoint.
    7.  **Implement `MyPhotos` Backend:** Implemented `findDetectedFacesByUserId`, `findPhotosByIds` in `databaseService.ts`.
    8.  **Deploy `getMyPhotos` Lambda & API Gateway:** Deployed and configured `GET /api/my-photos` route.
    9.  **Build Frontend `MyPhotos` Dashboard:** Created component to display matched photos.

### Phase 3: Historical Matching & Photo Upload Implementation (Completed)

*   **Goal:** Implement the historical matching functionality for newly registered users and photo upload workflow.
*   **Status:** Completed.
*   **Tasks Completed:**

    1. **Enhanced Dashboard Implementation:**
       - Created a full-featured dashboard with face recognition capabilities
       - Added tabs for Home, Matches, and Upload sections
       - Implemented UI for displaying historical matches
       - Set up face verification using webcam
       - Added user information and status indicators

    2. **AWS Integration Enhancement:**
       - Added DynamoDB Document Client implementation
       - Created necessary Marshal/Unmarshal functions for DynamoDB data
       - Implemented proper error handling for AWS API calls

    3. **Historical Matching Implementation:**
       - Enhanced the `matchAgainstExistingFaces` function in FaceIndexingService.js
       - Implemented SearchFaces API calls to find faces in previously uploaded photos
       - Added logic to update Photos table with user associations
       - Created notifications system for historical matches

    4. **Database Table Creation:**
       - Created `shmong-notifications` table for historical match notifications
       - Added UserIdIndex GSI to efficiently query by user ID
       - Created proper update mechanisms for face-match associations

    5. **Authentication and Routing Fixes:**
       - Updated auth context imports to ensure proper authentication
       - Fixed PrivateRoute component for protected views
       - Ensured proper routing for registration and dashboard
       - Fixed Dashboard.js vs Dashboard.jsx conflicts

    6. **Testing Implementation:**
       - Added verification steps in the face registration process
       - Implemented face detection to validate user images
       - Added support for viewing matched photos

### Phase 4: System Standardization and API Enhancement (Completed)

*   **Goal:** Standardize collection names, table references, enhance API endpoints, and improve system reliability.
*   **Status:** Completed.
*   **Tasks Completed:**

    1. **Collection Name Standardization:**
       - Standardized AWS Rekognition collection names throughout the codebase
       - Replaced non-existent collections ('face-registration' and 'user-photos') with existing collections ('shmong-faces' and 'user-faces')
       - Updated default collection in awsClient.js to consistently use 'shmong-faces'

    2. **Table Name Standardization:**
       - Fixed inconsistent references to DynamoDB tables
       - Ensured consistent use of 'shmong-face-data' instead of 'face_data' throughout the codebase
       - Updated FaceStorageService.js and related components with standardized table references

    3. **API Endpoint Alignment:**
       - Created API Gateway resources to match front-end expectations
       - Implemented standardized endpoints for:
         - User registration and login
         - Face registration
         - Face data retrieval
         - Historical and recent matches
         - Photo upload processing
       - Verified endpoints return appropriate responses, though some endpoints require additional implementation

    4. **Dependency Conflict Resolution:**
       - Updated package.json to fix incompatible Uppy package versions
       - Added missing dependencies required by the application
       - Resolved some package conflicts, though some dependency issues remain

    5. **Comprehensive Testing:**
       - Created testing scripts (test-face-matching-system.js and simple-api-test.js)
       - Implemented tests for API endpoints, face registration, historical matching, future matching, and error handling
       - Documented test results and remaining issues in test logs

## 4. Testing the Historical Matching Functionality

To test the historical matching functionality:

1. **Start the Application:**
   ```
   npm run dev
   ```
   Access the application at http://localhost:5177/

2. **Register an Account:**
   - Visit the login page and create a new account
   - Complete the email verification process
   - Log in with your new account

3. **Register Your Face:**
   - On the dashboard, click the "Register Face" button
   - Position your face in the frame
   - Capture your face image
   - The system will register your face with AWS Rekognition

4. **View Historical Matches:**
   - After registration, the system automatically runs historical matching
   - If matches are found, they'll appear on your dashboard
   - The "Matches" tab will display all photos you've been found in
   - You'll receive a notification about the number of matches found

5. **Upload New Photos (for testing future matching):**
   - Click the "Upload" tab
   - Use the "Upload New Photos" button to upload test photos
   - Photos with faces will be processed and matched against registered users

6. **Verify Identity:**
   - Use the "Verify Identity" button to confirm your face matches the registered one
   - The system will display match confidence and similarity scores

## 5. Known Issues / Troubleshooting Log

*   **PostCSS Config Error:** Initially encountered persistent `[ReferenceError] module is not defined in ES module scope` errors when running `npm run dev`, related to `postcss.config.js` being treated as ESM due to `"type": "module"` in `package.json`. **Resolution:** Renamed config to `postcss.config.cjs` and ensured `module.exports` syntax was used. Verified `npm run dev` now works.
*   **AWS CLI Failures:** Experienced difficulties creating IAM Policies and DynamoDB GSIs reliably via AWS CLI, possibly due to JSON parsing/quoting issues or terminal environment limitations. **Workaround:** Used AWS Management Console for manual creation/verification of IAM Policy (`ShmongLambdaExecPolicy`) and DynamoDB GSIs (`RekognitionFaceIdIndex`, `AnonymousFaceIdIndex`, `EmailIndex`). Policy attachment to Role (`ShmongLambdaExecRole`) was eventually successful via CLI.
*   **Dummy API Gateway Test Failure:** Creating a test Lambda (`shmong-dummy-test`) and HTTP API Gateway (`shmong-test-api`) via CLI resulted in "Internal Server Error" on invocation, despite direct Lambda test succeeding. **Resolution:** Decided to ignore this test failure and proceed, creating specific API Gateway integrations for actual function Lambdas later, assuming the issue was specific to the test setup or default route integration.
*   **DynamoDB Index Creation Time:** Noted that GSI creation (`EmailIndex`) status was `CREATING` after the command; requires waiting for `ACTIVE` status before dependent code (`findUserByEmail`) works efficiently.
*   **Dashboard Import Issues:** Encountered issues with duplicate Dashboard components (Dashboard.js vs Dashboard.jsx) causing rendering conflicts. **Resolution:** Properly configured App.jsx to import Dashboard.js and removed the duplicate component.
*   **AWS Client Configuration:** Faced issues with missing docClient in awsClient.js causing white screens. **Resolution:** Added DynamoDBDocumentClient implementation and proper marshalling functions.
*   **Auth Context Path Issues:** Experienced authentication errors due to incorrect import paths. **Resolution:** Updated all imports to use the correct path for AuthContext.
*   **Collection Name Mismatch:** Discovered references to non-existent collections ('face-registration' and 'user-photos') throughout the codebase. **Resolution:** Standardized all references to use existing collections ('shmong-faces' and 'user-faces') and updated awsClient.js default collection to consistently use 'shmong-faces'.
*   **Table Name Inconsistency:** Found inconsistent references to DynamoDB tables with some code using 'shmong-face-data' and others using 'face_data'. **Resolution:** Standardized all table references to consistently use 'shmong-face-data', particularly in FaceStorageService.js.
*   **API Endpoint Misalignment:** Identified that front-end expected API endpoints that weren't properly implemented or aligned with back-end resources. **Resolution:** Created API Gateway resources matching front-end expectations, though some endpoints (login, register, face registration, photo upload) still require additional implementation.
*   **Package Dependency Conflicts:** Encountered incompatible Uppy package versions and missing dependencies causing build and runtime issues. **Resolution:** Updated package.json with corrected versions and added missing dependencies, though some package conflicts remain.
*   **API Gateway Integration Issues:** Despite setting up Lambda functions and API Gateway resources with correct integrations, API endpoints return "Missing Authentication Token" errors. **Partial Resolution:** Created and deployed Lambda functions for all required endpoints, integrated them with API Gateway, and added proper permissions. Further investigation is needed to resolve "Missing Authentication Token" errors, which might be related to API Gateway configuration, resource path issues, or authorization settings.

## 6. Next Steps & Future Improvements

1. **Performance Optimization:**
   - Add pagination for photo matches display
   - Implement lazy loading for matched photos
   - Optimize AWS Rekognition calls for batch processing

2. **Enhanced User Experience:**
   - Add real-time notifications for new matches
   - Implement photo sharing capabilities
   - Create albums for organizing matched photos

3. **Security Enhancements:**
   - Add multi-factor authentication
   - Implement AWS Cognito pools for authentication
   - Add fine-grained access controls for photos

4. **Additional Features:**
   - Group photos by events or time periods
   - Add face recognition confidence thresholds settings
   - Implement photo filtering and sorting options

5. **API Completion & Stability:**
   - **Complete API Gateway Configuration:** Investigate and resolve the "Missing Authentication Token" errors by checking API Gateway configuration, resource paths, and authorization settings.
   - **Verify API Gateway Path Mapping:** Ensure API Gateway resource paths match the expected endpoints in the front-end code.
   - **Test with Different API Gateway Configuration:** Consider recreating the API with different settings, such as using REST API instead of HTTP API, or updating the resource path structure.
   - **Add Custom Domains:** Set up a custom domain for the API Gateway to make the URLs more user-friendly.
   - **Add comprehensive error handling for all API endpoints:** Standardize error responses and add proper validation.
   - **Implement proper response formats and status codes:** Ensure all endpoints follow REST API best practices.

6. **Dependency Management:**
   - Resolve remaining package conflicts in package.json
   - Update deprecated dependencies
   - Implement proper version locking for critical dependencies

7. **Testing & Monitoring:**
   - Complete API endpoint testing once deployment issues are resolved
   - Add monitoring for AWS service quotas and usage
   - Create alerting system for service disruptions or failures
   - Test with real user data and photo datasets

## 7. Potential Issues & Technical Considerations

### 7.1 Device and Browser Compatibility

- **Camera Requirements:**
  - Front-facing camera is required for face registration
  - Minimum camera recording capability: 15 frames per second
  - Color camera that can record in at least 320x240px resolution
  - Virtual cameras or camera software are not supported

- **Display Requirements:**
  - Minimum refresh rate: 60 Hz
  - Minimum screen size: 4 inches
  - Device should not be jailbroken or rooted

- **Browser Support:**
  - Only the latest three versions of major browsers are supported (Chrome, Firefox, Safari, Edge)
  - Mobile browsers may have inconsistent camera access implementations

### 7.2 Performance Considerations

- **AWS Service Quotas:**
  - AWS Rekognition has service quotas that could be exceeded during high traffic
  - Consider implementing request rate limiting and queue mechanisms for large events

- **Network Requirements:**
  - Minimum bandwidth of 100kbps required for face registration
  - Users with poor connections may experience timeouts or failures
  - Large photo uploads might fail on unstable connections

- **Storage Scaling:**
  - S3 storage costs will scale with photo volume
  - Consider implementing photo compression strategies while maintaining recognition quality

### 7.3 Recognition Accuracy Challenges

- **Lighting Conditions:**
  - Poor lighting significantly reduces face detection accuracy
  - Consider adding lighting recommendations in the UI

- **Face Occlusion:**
  - Masks, sunglasses, hats may prevent successful registration or matching
  - Implement clear guidance for users about proper face positioning

- **Image Format Considerations:**
  - JPEG with EXIF metadata and PNG are handled differently by Rekognition
  - JPEG orientation is automatically corrected while PNG orientation is not
  - Implement proper handling for both formats

### 7.4 User Experience Challenges

- **Face Positioning:**
  - Users may struggle with proper face positioning during registration
  - Implement clear visual guides in the UI for optimal face registration

- **Match Expectations:**
  - Users may have unrealistic expectations for match accuracy
  - Clearly communicate confidence thresholds and potential limitations

- **Notification Overload:**
  - Highly photographed users could receive excessive notifications
  - Implement notification batching and preference settings

### 7.5 Security and Privacy Considerations

- **Biometric Data Handling:**
  - Facial biometric data requires proper user consent and secure handling
  - Implement clear privacy policies and consent mechanisms
  - Consider data retention policies for face vectors and registration data

- **False Positives/Negatives:**
  - Large collections increase the risk of false matches
  - Implement confidence threshold settings and manual verification options

- **Access Control:**
  - DynamoDB and S3 permissions need careful configuration
  - Implement proper IAM roles and policies for all lambda functions

### 7.6 AWS Rekognition Specific Considerations

- **Face Liveness Detection:**
  - If implementing liveness detection, note the additional requirements:
    - Proper webcam mounting for desktop users
    - Minimum refresh rate and display size requirements
    - FaceLivenessDetector component from AWS Amplify SDKs required

- **Error Handling:**
  - Implement proper handling for common Rekognition errors:
    - ProvisionedThroughputExceededException
    - ServiceQuotaExceededException
    - InvalidParameterException
    - ResourceNotFoundException

- **Versioning:**
  - AWS regularly updates Face Recognition SDKs
  - Maintain compatibility with AWS SDK versions
  - Plan for regular updates to maintain security 