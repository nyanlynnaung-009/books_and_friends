# Books & Friends Mobile App

This is the React Native (Expo) mobile application for the Books & Friends platform.

## Prerequisites

- Node.js installed on your local machine
- The [Expo Go](https://expo.dev/client) app installed on your iOS or Android device

## Getting Started

1. Export this project by clicking the **Export** button in the AI Studio settings menu (top right) and downloading the ZIP file.
2. Extract the ZIP file and open your terminal.
3. Navigate to the `mobile` directory:
   ```bash
   cd mobile
   ```
4. Install the dependencies:
   ```bash
   npm install
   ```
5. Start the Expo development server:
   ```bash
   npm start
   ```
6. Open the **Expo Go** app on your phone and scan the QR code that appears in your terminal.

## Features Implemented
- **Authentication**: Sign in and sign up using Supabase Auth.
- **Dashboard**: View all active public reading sessions.
- **Session Detail**: View the book details and the discussion thread.
- **Comments & Replies**: Read and post comments, and reply to specific users.
- **Reactions**: React to comments using emojis.

## Note on Environment Variables
The Supabase URL and Anon Key are currently hardcoded in `src/lib/supabase.ts` to match the web app's configuration for ease of testing. For production, you should move these to an `.env` file and use `process.env.EXPO_PUBLIC_SUPABASE_URL`.
