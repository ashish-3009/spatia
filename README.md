# Spatia

Spatia is a personal, cloud-backed 3D photo space. Drop a folder of photos, watch them float in 3D, and arrange them using mouse/trackpad controls, mobile touch gestures, or hands-free webcam tracking. Sign in to save, load, and edit your spaces from any device.

## Features

- **3D Photo Cloud**: Hover, inspect, and arrange your photos in an immersive 3D gallery.
- **Webcam Hand Gestures**: Move, scale, and rotate photos using real-time hand-tracking (powered by MediaPipe).
- **Edit & Add Photos**: Dynamically add new photos to an existing space. Spatia automatically arranges the new photos without disturbing the positions of the existing ones.
- **Supabase Cloud Syncing**: Photos are stored securely in Supabase Storage, and layout metadata is stored in Postgres, making your spaces accessible from any browser.

## Stack

- **Frontend**: React 19 + Vite + TypeScript
- **3D Rendering**: Three.js (custom pipeline with SMAA & OutlinePass highlights)
- **State Management**: Zustand
- **Backend & Auth**: Supabase (Postgres Database, Storage Buckets, and Magic Link Authentication)
- **Hosting**: Vercel

---

## Local Development Setup

### 1. Initialize Supabase Backend
1. Create a free project at [supabase.com](https://supabase.com/).
2. In the Supabase project dashboard, navigate to the **SQL Editor** in the left menu.
3. Click **New Query**, copy the contents of the database schema migration file [`0001_init.sql`](supabase/migrations/0001_init.sql), paste it, and click **Run**.
4. Click **New Query** again, copy the contents of the storage policy migration file [`0002_storage.sql`](supabase/migrations/0002_storage.sql), paste it, and click **Run**. This initializes the table schema and the secure private `photos` storage bucket.

### 2. Configure Environment Variables
1. Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase connection parameters:
   - `VITE_SUPABASE_URL`: Found in Supabase -> Settings -> API.
   - `VITE_SUPABASE_ANON_KEY`: Found in Supabase -> Settings -> API -> `anon public` key.

### 3. Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## Pushing to GitHub & Deploying to Vercel

### Step 1: Push the Code to GitHub
1. Create a new, blank repository on your [GitHub](https://github.com/) account.
2. In your terminal, run the following commands to initialize Git and commit the files:
   ```bash
   # Initialize git (if not already done)
   git init
   
   # Stage all files
   git add .
   
   # Commit changes
   git commit -m "Configure Spatia app and save/update space features"
   
   # Rename default branch to main
   git branch -M main
   
   # Link your local repo to GitHub and push (replace with your repo URL)
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Import the GitHub repository you just pushed.
3. Under **Environment Variables**, add the keys and values from your local `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and serve your app.

### Step 3: Configure Auth Redirects
To log in on the live site, tell Supabase about your new production URL so authentication works:
1. In the **Supabase Dashboard**, go to **Settings** (gear icon) -> **API** -> **Authentication**.
2. Locate **URL Configuration**.
3. Change the **Site URL** to your Vercel URL (e.g., `https://spatia.vercel.app`).
4. Under **Redirect URLs**, add your Vercel URL as well.
