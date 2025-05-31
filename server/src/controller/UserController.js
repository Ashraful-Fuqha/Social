"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPlaylists = exports.getUserProfile = exports.getChannelSubscribers = exports.getMySubscriptions = exports.getUserLikedVideos = exports.getUserLikedVideosHandler = exports.getUserById = exports.getUserByIdHanlder = exports.findOrCreateUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema_1 = __importDefault(require("../models/UserSchema"));
const PlaylistSchema_1 = __importDefault(require("../models/PlaylistSchema"));
const asyncHandler_1 = require("../utils/asyncHandler");
const APIResponse_1 = require("../utils/APIResponse");
const APIError_1 = require("../utils/APIError");
const clerk_sdk_node_1 = __importDefault(require("@clerk/clerk-sdk-node"));
const VideoSchema_1 = __importDefault(require("../models/VideoSchema"));
exports.findOrCreateUser = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId; // Use optional chaining for safety
    if (!clerkUserId) {
        // This should ideally be caught by a Clerk authentication middleware before this handler
        throw new APIError_1.ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
    // Attempt to find the user by clerkId
    let user = yield UserSchema_1.default.findOne({ clerkId: clerkUserId });
    if (!user) {
        try {
            // --- Fetch user data from Clerk API ---
            const clerkUser = yield clerk_sdk_node_1.default.users.getUser(clerkUserId);
            // --- Extract desired data from Clerk user object ---
            // Clerk stores emails in an array. Find the primary one or the first one.
            const primaryEmailObj = ((_b = clerkUser.emailAddresses) === null || _b === void 0 ? void 0 : _b.find(email => email.id === clerkUser.primaryEmailAddressId)) || ((_c = clerkUser.emailAddresses) === null || _c === void 0 ? void 0 : _c[0]);
            const email = (primaryEmailObj === null || primaryEmailObj === void 0 ? void 0 : primaryEmailObj.emailAddress) || `${clerkUserId}@example.com`; // Fallback email
            // Construct full name. Clerk stores first and last name separately.
            const fullname = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || `Clerk User ${clerkUserId}`; // Fallback full name
            // Use Clerk username if available, otherwise use a fallback
            const username = clerkUser.username; // Fallback username
            const avatarUrl = clerkUser.imageUrl || ''; // Fallback avatar URL
            // --- Create a new user entry in your database using Clerk data ---
            user = new UserSchema_1.default({
                clerkId: clerkUserId,
                username: username, // Use the extracted username
                email: email, // Use the extracted email
                fullname: fullname, // Use the constructed full name
                avatarUrl: avatarUrl,
            });
            yield user.save();
        }
        catch (clerkError) {
            console.error(`Failed to fetch user data from Clerk API for ID ${clerkUserId}:`, clerkError);
            throw new APIError_1.ApiError(500, `Failed to retrieve user details from authentication provider (${clerkUserId}). Cannot create user.`);
        }
    }
    // Attach the user document to the request object
    req.user = user;
    // Proceed to the next middleware or the route handler
    next();
    // Note: Do NOT send a response here. This handler is middleware.
}));
// Step 2: Export the wrapped function
// Controller to get the logged-in user's profile
// This controller assumes req.user is populated by findOrCreateUser middleware
const getUserByIdHanlder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The user document is already attached to req.user by findOrCreateUser
    const user = req.user;
    if (!user) {
        // This should not happen if findOrCreateUser ran correctly
        throw new APIError_1.ApiError(404, 'User document not found after authentication');
    }
    // Return the user document
    res.status(200).json(new APIResponse_1.APIResponse(200, user, 'User profile fetched successfully'));
});
exports.getUserByIdHanlder = getUserByIdHanlder;
exports.getUserById = (0, asyncHandler_1.asyncHandler)(exports.getUserByIdHanlder);
// Controller to fetch the logged-in user's liked video IDs
const getUserLikedVideosHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The user document is already attached to req.user by findOrCreateUser
    const user = req.user;
    if (!user) {
        throw new APIError_1.ApiError(404, 'User document not found after authentication');
    }
    try {
        // Return the array of liked video IDs from the user document
        res.status(200).json(new APIResponse_1.APIResponse(200, user.likedVideos, 'User liked video IDs fetched successfully'));
    }
    catch (error) {
        console.error('Error fetching user liked videos:', error);
        throw new APIError_1.ApiError(500, 'Internal Server Error');
    }
});
exports.getUserLikedVideosHandler = getUserLikedVideosHandler;
exports.getUserLikedVideos = (0, asyncHandler_1.asyncHandler)(exports.getUserLikedVideosHandler);
// Controller to fetch the logged-in user's subscribed channel IDs
exports.getMySubscriptions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dbUser = req.user;
    if (!dbUser) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    const userWithSubscriptions = yield UserSchema_1.default.findById(dbUser._id).populate({
        path: 'subscribedChannels',
        // We only need the _id here if that's all the client expects
        // If the client needs username, fullname, avatarUrl, keep them
        select: '_id',
        model: 'User',
    });
    if (!userWithSubscriptions) {
        throw new APIError_1.ApiError(404, 'Authenticated user not found');
    }
    const subscribedChannelIds = userWithSubscriptions.subscribedChannels.map((channel) => channel._id);
    // Directly return the populated subscribedChannels array
    // No need for Promise.all and counting videos if you want it simplified
    res.status(200).json(new APIResponse_1.APIResponse(200, subscribedChannelIds, // This will be an array of channel objects
    'User subscriptions fetched successfully'));
}));
exports.getChannelSubscribers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channelId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(channelId)) {
        throw new APIError_1.ApiError(400, 'Invalid channel ID');
    }
    const channelUser = yield UserSchema_1.default.findById(channelId);
    if (!channelUser) {
        throw new APIError_1.ApiError(404, 'Channel user not found');
    }
    const subscribers = yield UserSchema_1.default.find({ subscribedChannels: channelId })
        .select('username fullname avatarUrl');
    res.status(200).json(new APIResponse_1.APIResponse(200, subscribers, `Subscribers of channel "${channelUser.username}" fetched successfully`));
}));
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new APIError_1.ApiError(400, 'Invalid user ID');
    }
    const user = yield UserSchema_1.default.findById(userId).select('username fullname avatarUrl');
    if (!user) {
        throw new APIError_1.ApiError(404, 'User not found');
    }
    const latestVideos = yield VideoSchema_1.default.find({ ownerDetails: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id title thumbnailUrl duration createdAt views ownerDetails');
    res.status(200).json(new APIResponse_1.APIResponse(200, { user, latestVideos }, 'User profile fetched successfully'));
}));
// Controller to fetch the logged-in user's playlists
const getUserPlaylistsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the authenticated user document attached by findOrCreateUser middleware
    // Use req.dbUser based on the findOrCreateUser middleware correction
    const user = req.user;
    if (!user) {
        // This indicates an issue with the middleware chain if requireAuth passed
        throw new APIError_1.ApiError(401, 'User not authenticated or user data not found in request');
    }
    // Find playlists owned by this user using their MongoDB _id
    // Remove the redundant try/catch as asyncHandler handles errors
    const playlists = yield PlaylistSchema_1.default.find({ owner: user._id }).sort({ createdAt: -1 }); // 
    res.status(200).json(new APIResponse_1.APIResponse(200, playlists, 'User playlists fetched successfully')); // Return array of playlist objects
});
// Export the wrapped function using asyncHandler
exports.getUserPlaylists = (0, asyncHandler_1.asyncHandler)(getUserPlaylistsHandler);
