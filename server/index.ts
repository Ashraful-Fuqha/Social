import express from 'express';
import dotenv from 'dotenv';
import cors from "cors"
import { connectDB } from './src/db/dbconnect';

dotenv.config({
    path: '.env'
})
connectDB()

const app = express();


const corsOptions = {
    origin: process.env.CORS_ORIGIN ,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], 
    credentials: true 
}

import fs from 'fs/promises'; // Use fs/promises for async operations
import path from 'path';

// ... other imports and app setup ...

const tempUploadDir = path.join(process.cwd(), 'public', 'temp');

async function ensureUploadDirectory() {
  try {
    await fs.mkdir(tempUploadDir, { recursive: true });
    // console.log(`Ensured upload directory exists: ${tempUploadDir}`);
  } catch (error) {
    console.error(`Failed to create upload directory ${tempUploadDir}:`, error);
    // Depending on criticality, you might want to exit or log a warning
    process.exit(1); // Exit if this is a fatal error
  }
}

// Call this at the start of your application
ensureUploadDirectory();

app.use(cors(corsOptions))


import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Recommended for HTTPS
});

const port = process.env.PORT || 5000; // Backend port

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json());

// Optional: Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// --- Clerk Backend Integration ---
// ClerkExpressRequireAuth is applied directly in the route files for specific routes.
// Ensure your .env has CLERK_SECRET_KEY set.

// --- Import Routers ---
import userRoutes from './src/routes/UserRoutes';
import videoRoutes from './src/routes/VideoRoutes';
import playlistRoutes from './src/routes/PlaylistsRoute';

    // --- Use Routers ---
    // Prefix API routes with /api/v1
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/playlists', playlistRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access it at http://localhost:${port}`);
});