# Project Specification: Books & Friends

## Executive Summary
**Books & Friends** is a social reading platform designed to bring readers together. It allows users to create and join public reading sessions, track their reading progress collaboratively using pages or percentages, and engage in focused, single-thread discussions with comprehensive emoji reactions. Users can also upload and share actual book files (PDF/EPUB) and cover images in a shared Library.

## Finalized Requirements

| Requirement | Description |
| :--- | :--- |
| **Session Visibility** | Public sessions only. (Private sessions planned for v2). |
| **Progress Tracking** | Supports tracking by Page Numbers or Percentages (%). |
| **Book Data & Files** | Manual input by users. Supports uploading PDF/EPUB files and cover images. |
| **Reactions** | Comprehensive set of emojis (👍, ❤️, 😂, 😲, 😢, 📖, ✨, 🤩, 📚) for comments. |
| **Development Order** | Web App and Mobile App (React Native/Expo) are both implemented. |

## Core Features

*   **User Authentication & Profiles:** Anyone can register and create an account. Users will have basic profiles to identify themselves in discussions. The authentication flow features a modern, glassmorphic UI with password visibility toggles.
*   **Admin Role & Dashboard:** A dedicated 'admin' role exists for full platform control. The default admin is `admin@example.com`. Admins have access to a dedicated Admin Dashboard to manage users, where they can view user profiles (including avatars and display names) alongside their email addresses. Admins also have the authority to delete any reading session, book, comment, or reaction.
*   **Profile Customization:** Users can update their display name, upload custom profile pictures (avatars) stored in Supabase Storage, and remove their avatars. Profile updates (like changing an avatar or name) are reflected in real-time across the application.
*   **Shared Library & Book Uploads:** Users can upload book files (PDF/EPUB) along with cover images to a shared Library. Uploading a book automatically creates a reading session for it.
*   **Public Reading Sessions:** Members can create a new public reading session by manually submitting a book's Title, Author, and Total Pages/Chapters. Anyone can browse and join. Creators can delete their sessions if they wish. Admins can delete any session.
*   **Advanced Progress Tracking:** Participants can log and update their reading progress using page numbers or percentages, allowing the group to see real-time progress.
*   **Single-Thread Discussions with Replies:** Each session features a dedicated discussion board where users can share thoughts, edit/delete their own comments, and reply to each other's comments to create threaded conversations. Admins can delete any comment.
*   **Comprehensive Social Reactions:** Members can react to comments and replies using an expanded set of emojis (including 📖, ✨, 🤩, 📚) to foster engagement. Admins can delete any reaction.

## Technical Stack
*   **Backend:** Supabase (PostgreSQL, Authentication, Realtime subscriptions, Storage).
*   **Web App:** React, TypeScript, Tailwind CSS, Vite.
    *   **UI/UX:** Modern design system using a `stone` and `rose` color palette, with `Lora` (serif) for headings and `Inter` (sans-serif) for body text.
*   **Mobile App:** React Native (Expo) - *Implemented in the `mobile/` directory*.

## Current Supabase Setup (Context)

### Database Schema
The project uses the following PostgreSQL tables configured in Supabase. All tables have **Row Level Security (RLS)** enabled.

*   **`profiles`**: Stores user profile data.
    *   Columns: `id` (uuid, primary key), `email` (text), `display_name` (text), `avatar_url` (text), `role` (text).
    *   *Note*: Automatically populated via a trigger (`handle_new_user`) on `auth.users` creation.
*   **`books`**: Stores book metadata and file references.
    *   Columns: `id` (uuid, primary key), `title` (text), `author` (text), `description` (text), `total_pages` (int), `file_url` (text), `file_type` (text), `cover_url` (text), `creator_id` (uuid, references auth.users), `created_at` (timestamp).
*   **`reading_sessions`**: Represents a public reading group for a specific book.
    *   Columns: `id` (uuid, primary key), `book_id` (uuid, references books), `creator_id` (uuid, references auth.users), `status` (text, default 'active'), `created_at` (timestamp).
*   **`session_participants`**: Tracks which users are in which session and their reading progress.
    *   Columns: `session_id` (uuid, primary key part), `user_id` (uuid, primary key part), `current_progress` (numeric), `updated_at` (timestamp).
*   **`comments`**: Stores discussion messages within a reading session.
    *   Columns: `id` (uuid, primary key), `session_id` (uuid, references reading_sessions), `user_id` (uuid, references auth.users), `content` (text), `created_at` (timestamp).
*   **`reactions`**: Stores emoji reactions to specific comments.
    *   Columns: `id` (uuid, primary key), `comment_id` (uuid, references comments), `user_id` (uuid, references auth.users), `reaction_type` (text).

### Storage
*   **`avatars` Bucket**: A public Supabase Storage bucket used for storing user-uploaded profile pictures.
*   **`book_files` Bucket**: A public Supabase Storage bucket used for storing uploaded book files (PDF/EPUB) and cover images.

### Security & Policies
*   **Read Access**: All tables are publicly viewable (`select using (true)`).
*   **Write Access**: 
    *   Authenticated users can insert into `books`, `reading_sessions`, `session_participants`, `comments`, and `reactions`.
    *   Users can update their own `profiles` and `session_participants.current_progress`.
    *   Users can **delete** their own `reactions` (to toggle them off).
    *   Admins have full delete privileges across all tables.

### Environment & Integration
*   **Client Initialization**: The Supabase client is initialized in `src/lib/supabaseClient.ts`.
*   **Environment Variables**: Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to be set in the `.env` file.
*   **Full SQL Setup**: See `supabase_setup.sql` and `supabase_admin_policies.sql` for the complete DDL and policy definitions.

### Test Accounts
The following test accounts have been seeded into the Supabase authentication system for development purposes:
*   `admin@example.com` (Admin role)
*   `hanako@example.com`
*   `sora@example.com`
*(Password for all test accounts: `password123`)*
