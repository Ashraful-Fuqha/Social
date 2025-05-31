"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const dbconnect_1 = require("./src/db/dbconnect");
const app = (0, express_1.default)();
dotenv_1.default.config({
    path: '.env'
});
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
(0, dbconnect_1.connectDB)();
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Recommended for HTTPS
});
const port = process.env.PORT || 5000; // Backend port
// --- Middleware ---
// Parse JSON request bodies
app.use(express_1.default.json());
// Optional: Parse URL-encoded request bodies
app.use(express_1.default.urlencoded({ extended: true }));
// --- Clerk Backend Integration ---
// ClerkExpressRequireAuth is applied directly in the route files for specific routes.
// Ensure your .env has CLERK_SECRET_KEY set.
// --- Import Routers ---
const UserRoutes_1 = __importDefault(require("./src/routes/UserRoutes"));
const VideoRoutes_1 = __importDefault(require("./src/routes/VideoRoutes"));
const PlaylistsRoute_1 = __importDefault(require("./src/routes/PlaylistsRoute"));
// --- Use Routers ---
// Prefix API routes with /api/v1
app.use('/api/v1/users', UserRoutes_1.default);
app.use('/api/v1/videos', VideoRoutes_1.default);
app.use('/api/v1/playlists', PlaylistsRoute_1.default);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Access it at http://localhost:${port}`);
});
