import express from 'express';
import {
    getUserById,  
    getMySubscriptions, 
    getUserPlaylists, 
    findOrCreateUser,
    getUserProfile,
    getChannelSubscribers,
} from '../controller/UserController'; 
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { toggleSubscription } from '../controller/InteractionController';
import { addToWatchHistory, getUserWatchHistory, removeFromWatchHistory } from '../controller/HistoryController'
import {
  addToWatchLater,
  getUserWatchLater,
  removeFromWatchLater,
} from '../controller/WatchLaterController';

const router = express.Router();

// --- Protected Routes (Require Authentication) ---
// Apply ClerkExpressRequireAuth and findOrCreateUser middleware to all routes in this router
// This ensures the user is authenticated by Clerk and exists in our DB before any user-specific action

// APPLYING MIDDLEWARE SEQUENTIALLY USING SEPARATE USE CALLS
router.use(clerkMiddleware())
router.use(requireAuth()) 


router.use(findOrCreateUser); // Then apply findOrCreateUser middleware

router.get('/me', getUserById);
router.get('/me/subscriptions', getMySubscriptions);
router.get('/:channelId/subscribers', getChannelSubscribers)
router.post('/:channelId/subscribe', toggleSubscription)
router.post('/:channelId/unsubscribe', toggleSubscription)
router.get('/profile/:userId', getUserProfile);
router.get('/me/playlists', getUserPlaylists);

router.post('/later/:videoId', addToWatchLater); 
router.get('/later/', getUserWatchLater);
router.delete('/later/:videoId', removeFromWatchLater);

router.get('/history', getUserWatchHistory)
router.post('/history/:videoId', addToWatchHistory)
router.delete('/history/:videoId', removeFromWatchHistory);


export default router;