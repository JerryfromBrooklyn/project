# Face Matching App

This application performs face recognition using AWS Rekognition and Supabase.

## Features

- Face registration and matching
- Photo upload and management 
- Multiple account linking to see all your photos across accounts
- Debug tools for face collection management

## Setup

### Prerequisites

- Node.js and npm
- Supabase account
- AWS Rekognition setup

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see .env.example)
4. Start the development server:
   ```
   npm run dev
   ```

## Supabase Migration

The project uses Supabase migrations to manage the database schema. The migrations are located in the `supabase/migrations` directory.

### Running Migrations

To apply migrations to your local Supabase instance:

```bash
npx supabase migration up
```

To create a new migration:

```bash
npx supabase migration new migration_name
```

### Available Migrations

- `linked_accounts` - Creates the linked_accounts table and related functions
- `debug_force_update_photo` - Adds a debug function to force update a photo with a user match
- `function_exists` - Helper function to check if other functions exist

## Linked Accounts Feature

The Linked Accounts feature allows users to link multiple accounts together. This is useful when a user has multiple accounts and wants to see all their photos in one place.

### How to Use

1. Navigate to the Photos page
2. Click on the "Link Accounts" button
3. Generate a link code on your first account
4. Log in to your second account
5. Enter the link code to connect the accounts
6. Photos matching your face from either account will now appear in both accounts

### Database Functions

The following functions are available for the Linked Accounts feature:

- `link_user_accounts(primary_user_id, secondary_user_id)` - Links two user accounts
- `get_linked_accounts(user_id)` - Gets all linked accounts for a user
- `unlink_user_account(user_id)` - Unlinks a user account

## Debugging

For debugging issues with photo matching, the following tools are available:

- `debug_force_update_photo(photo_id, user_id)` - Forces a photo to be matched with a user
- `function_exists(function_name)` - Checks if a function exists in the database

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 