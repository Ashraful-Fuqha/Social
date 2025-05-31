import express from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import {
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    getVideoComments,
    getVideosByUserId,
    getVideosByIds, 
} from '../controller/VideoController'; 
import { findOrCreateUser, getUserLikedVideos } from '../controller/UserController'; 
import multer from 'multer'; 
import { IAuthRequest } from '../middlewares/AuthMiddleware';
import { addComment, deleteComment, toggleDislikeVideo, toggleLikeVideo, updateComment } from '../controller/InteractionController';

const router = express.Router();

// --- Multer Setup for File Uploads ---
// --- Multer Configuration ---
// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder for temporary storage
    cb(null, './public/temp'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Initialize Multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 100
    },
})

// --- Public Routes ---
router.get('/', getAllVideos);
router.get('/user/:userId', getVideosByUserId);
router.post('/videosbyId', getVideosByIds)
router.get('/:videoId/comments', getVideoComments);


// --- Protected Routes (Require Authentication) ---
router.use(clerkMiddleware())
router.use(requireAuth()) 
router.use(findOrCreateUser);

router.post(
    '/upload', 
    upload.fields([
        { name: 'videoFile', maxCount: 1 }, 
        { name: 'thumbnailFile', maxCount: 1 }
    ]),
    uploadVideo        
);

router.get('/:videoId', getVideoById);
router.get('/me/liked-videos', getUserLikedVideos);
router.post('/:videoId/likes', toggleLikeVideo)
router.delete('/:videoId/likes', toggleLikeVideo)
router.post('/:videoId/dislikes', toggleDislikeVideo)
router.delete('/:videoId/dislikes', toggleDislikeVideo)
router.post('/:videoId/comments', addComment);
router.patch('/comments/:commentId', updateComment)
router.delete('/comments/:commentId' , deleteComment)
router.put('/:videoId', updateVideo);
router.delete('/:videoId', deleteVideo);


export default router;
