@echo off
echo Installing dependencies...
npm install react react-dom react-router-dom @aws-sdk/client-dynamodb @aws-sdk/client-rekognition @aws-sdk/client-s3 @aws-sdk/lib-dynamodb @aws-sdk/s3-request-presigner dotenv cross-fetch framer-motion lucide-react react-dropzone clsx tailwind-merge react-webcam @react-google-maps/api

echo.
echo Starting development server...
npx vite

pause 