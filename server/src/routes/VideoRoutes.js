"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const VideoController_1 = require("../controller/VideoController");
const UserController_1 = require("../controller/UserController");
const multer_1 = __importDefault(require("multer"));
const InteractionController_1 = require("../controller/InteractionController");
const router = express_1.default.Router();
// --- Multer Setup for File Uploads ---
// --- Multer Configuration ---
// Define storage for uploaded files
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Set the destination folder for temporary storage
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// Initialize Multer upload instance
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 100
    },
});
// --- Public Routes ---
router.get('/', VideoController_1.getAllVideos);
router.get('/user/:userId', VideoController_1.getVideosByUserId);
router.post('/videosbyId', VideoController_1.getVideosByIds);
router.get('/:videoId/comments', VideoController_1.getVideoComments);
// --- Protected Routes (Require Authentication) ---
router.use((0, express_2.clerkMiddleware)());
router.use((0, express_2.requireAuth)());
router.use(UserController_1.findOrCreateUser);
router.post('/upload', upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 }
]), VideoController_1.uploadVideo);
router.get('/:videoId', VideoController_1.getVideoById);
router.get('/me/liked-videos', UserController_1.getUserLikedVideos);
router.post('/:videoId/likes', InteractionController_1.toggleLikeVideo);
router.delete('/:videoId/likes', InteractionController_1.toggleLikeVideo);
router.post('/:videoId/dislikes', InteractionController_1.toggleDislikeVideo);
router.delete('/:videoId/dislikes', InteractionController_1.toggleDislikeVideo);
router.post('/:videoId/comments', InteractionController_1.addComment);
router.patch('/comments/:commentId', InteractionController_1.updateComment);
router.delete('/comments/:commentId', InteractionController_1.deleteComment);
router.put('/:videoId', VideoController_1.updateVideo);
router.delete('/:videoId', VideoController_1.deleteVideo);
exports.default = router;
