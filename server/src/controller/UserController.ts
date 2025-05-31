import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/UserSchema'; 
import Playlist from '../models/PlaylistSchema'; 
import { IAuthRequest } from '../middlewares/AuthMiddleware'; 
import { asyncHandler } from '../utils/asyncHandler';
import { APIResponse } from '../utils/APIResponse';
import { ApiError } from '../utils/APIError';
import clerkClient from '@clerk/clerk-sdk-node';
import Video from '../models/VideoSchema';

export const findOrCreateUser = asyncHandler(async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const clerkUserId = req.auth?.userId; // Use optional chaining for safety

    if (!clerkUserId) {
        // This should ideally be caught by a Clerk authentication middleware before this handler
        throw new ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }

    // Attempt to find the user by clerkId
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {

        try {
            // --- Fetch user data from Clerk API ---
            const clerkUser = await clerkClient.users.getUser(clerkUserId);

            // --- Extract desired data from Clerk user object ---
            // Clerk stores emails in an array. Find the primary one or the first one.
            const primaryEmailObj = clerkUser.emailAddresses?.find(email => email.id === clerkUser.primaryEmailAddressId) || clerkUser.emailAddresses?.[0];
            const email = primaryEmailObj?.emailAddress || `${clerkUserId}@example.com`; // Fallback email

            // Construct full name. Clerk stores first and last name separately.
            const fullname = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || `Clerk User ${clerkUserId}`; // Fallback full name

            // Use Clerk username if available, otherwise use a fallback
            const username = clerkUser.username; // Fallback username

            const avatarUrl = clerkUser.imageUrl || ''; // Fallback avatar URL

            // --- Create a new user entry in your database using Clerk data ---
            user = new User({
                clerkId: clerkUserId,
                username: username, // Use the extracted username
                email: email,       // Use the extracted email
                fullname: fullname, // Use the constructed full name
                avatarUrl: avatarUrl, 
            });

            await user.save();

        } catch (clerkError) {
            console.error(`Failed to fetch user data from Clerk API for ID ${clerkUserId}:`, clerkError);
             throw new ApiError(500, `Failed to retrieve user details from authentication provider (${clerkUserId}). Cannot create user.`);
        }
    }

    // Attach the user document to the request object
    req.user = user;
    // Proceed to the next middleware or the route handler
    next();

    // Note: Do NOT send a response here. This handler is middleware.
});

// Step 2: Export the wrapped function


// Controller to get the logged-in user's profile
// This controller assumes req.user is populated by findOrCreateUser middleware
export const getUserByIdHanlder = async (req: IAuthRequest, res: Response): Promise<void> => {
    // The user document is already attached to req.user by findOrCreateUser
    const user = req.user;

    if (!user) {
         // This should not happen if findOrCreateUser ran correctly
        throw new ApiError(404, 'User document not found after authentication');
    }

    // Return the user document
    res.status(200).json(new APIResponse(200, user, 'User profile fetched successfully'));
};

export const getUserById = asyncHandler<IAuthRequest>(getUserByIdHanlder)

// Controller to fetch the logged-in user's liked video IDs
export const getUserLikedVideosHandler = async (req: IAuthRequest, res: Response): Promise<void> => {
         // The user document is already attached to req.user by findOrCreateUser
        const user = req.user;

        if (!user) {
            throw new ApiError(404, 'User document not found after authentication');
        }

        try {
            // Return the array of liked video IDs from the user document
            res.status(200).json(new APIResponse(200, user.likedVideos, 'User liked video IDs fetched successfully'));
        } catch (error) {
             console.error('Error fetching user liked videos:', error);
            throw new ApiError(500, 'Internal Server Error');
        }
};

export const getUserLikedVideos = asyncHandler<IAuthRequest>(getUserLikedVideosHandler)

    // Controller to fetch the logged-in user's subscribed channel IDs
export const getMySubscriptions = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const dbUser = req.user;
    if (!dbUser) {
        throw new ApiError(401, 'User not authenticated');
    }

    const userWithSubscriptions = await User.findById(dbUser._id).populate({
        path: 'subscribedChannels',
        // We only need the _id here if that's all the client expects
        // If the client needs username, fullname, avatarUrl, keep them
        select: '_id',
        model: 'User',
    });

    if (!userWithSubscriptions) {
        throw new ApiError(404, 'Authenticated user not found');
    }

    const subscribedChannelIds = userWithSubscriptions.subscribedChannels.map((channel: any) => channel._id);
    
    

    // Directly return the populated subscribedChannels array
    // No need for Promise.all and counting videos if you want it simplified
    res.status(200).json(new APIResponse(
        200,
        subscribedChannelIds, // This will be an array of channel objects
        'User subscriptions fetched successfully'
    ));
});

export const getChannelSubscribers = asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }

    const channelUser = await User.findById(channelId);
    if (!channelUser) {
        throw new ApiError(404, 'Channel user not found');
    }

    const subscribers = await User.find({ subscribedChannels: channelId })
        .select('username fullname avatarUrl');

    res.status(200).json(new APIResponse(200, subscribers, `Subscribers of channel "${channelUser.username}" fetched successfully`));
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
    }

    const user = await User.findById(userId).select('username fullname avatarUrl');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const latestVideos = await Video.find({ ownerDetails: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id title thumbnailUrl duration createdAt views ownerDetails');

    res.status(200).json(new APIResponse(200, { user, latestVideos }, 'User profile fetched successfully'));
});

// Controller to fetch the logged-in user's playlists
const getUserPlaylistsHandler = async (req: IAuthRequest, res: Response): Promise<void> => {
    // Get the authenticated user document attached by findOrCreateUser middleware
    // Use req.dbUser based on the findOrCreateUser middleware correction
    const user = req.user;

    if (!user) {
        // This indicates an issue with the middleware chain if requireAuth passed
        throw new ApiError(401, 'User not authenticated or user data not found in request');
    }

    // Find playlists owned by this user using their MongoDB _id
    // Remove the redundant try/catch as asyncHandler handles errors
    const playlists = await Playlist.find({ owner: user._id }).sort({ createdAt: -1 }); // 
    
    res.status(200).json(new APIResponse(200, playlists, 'User playlists fetched successfully')); // Return array of playlist objects
};

// Export the wrapped function using asyncHandler

export const getUserPlaylists = asyncHandler<IAuthRequest>(getUserPlaylistsHandler)