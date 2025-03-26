# Shmong App

A React application with TypeScript and TailwindCSS for face recognition and management.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AWS Account with Rekognition access
- Supabase Account

## Setup Instructions

1. Clone the repository:
```bash
git clone <your-repository-url>
cd shmong-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your actual environment variables in `.env`

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `/src` - Source code
- `/public` - Static assets
- `/scripts` - Utility scripts
- `/supabase` - Supabase configuration and migrations

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_AWS_REGION` - AWS region for Rekognition
- `VITE_AWS_ACCESS_KEY_ID` - AWS access key ID
- `VITE_AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `VITE_AWS_COLLECTION_ID` - AWS Rekognition collection ID
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password 