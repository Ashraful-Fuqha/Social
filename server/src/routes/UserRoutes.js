"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controller/UserController");
const express_2 = require("@clerk/express");
const InteractionController_1 = require("../controller/InteractionController");
const HistoryController_1 = require("../controller/HistoryController");
const WatchLaterController_1 = require("../controller/WatchLaterController");
const router = express_1.default.Router();
// --- Protected Routes (Require Authentication) ---
// Apply ClerkExpressRequireAuth and findOrCreateUser middleware to all routes in this router
// This ensures the user is authenticated by Clerk and exists in our DB before any user-specific action
// APPLYING MIDDLEWARE SEQUENTIALLY USING SEPARATE USE CALLS
router.use((0, express_2.clerkMiddleware)());
router.use((0, express_2.requireAuth)());
router.use(UserController_1.findOrCreateUser); // Then apply findOrCreateUser middleware
router.get('/me', UserController_1.getUserById);
router.get('/me/subscriptions', UserController_1.getMySubscriptions);
router.get('/:channelId/subscribers', UserController_1.getChannelSubscribers);
router.post('/:channelId/subscribe', InteractionController_1.toggleSubscription);
router.post('/:channelId/unsubscribe', InteractionController_1.toggleSubscription);
router.get('/profile/:userId', UserController_1.getUserProfile);
router.get('/me/playlists', UserController_1.getUserPlaylists);
router.post('/later/:videoId', WatchLaterController_1.addToWatchLater);
router.get('/later/', WatchLaterController_1.getUserWatchLater);
router.delete('/later/:videoId', WatchLaterController_1.removeFromWatchLater);
router.get('/history', HistoryController_1.getUserWatchHistory);
router.post('/history/:videoId', HistoryController_1.addToWatchHistory);
router.delete('/history/:videoId', HistoryController_1.removeFromWatchHistory);
exports.default = router;
