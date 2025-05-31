import { Request, Response, NextFunction } from 'express'; 
import mongoose from 'mongoose';
import Playlist, { IPlaylist } from '../models/PlaylistSchema';
import User from '../models/UserSchema'; 
import Video from '../models/VideoSchema'; 
import { IAuthRequest } from '../middlewares/AuthMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/APIError';
import { APIResponse } from '../utils/APIResponse'; 


// --- Create Playlist ---
// Requires authentication and user in DB (handled by middleware)
export const createPlaylist = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user;
    const { name } = req.body;

    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: User not found in request');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new ApiError(400, 'Playlist name is required');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Create a new playlist document
    const newPlaylist = new Playlist({
        name: name.trim(),
        owner: user._id, // Set the owner to the logged-in user's MongoDB ID
        videoIds: [], // Start with an empty array of video IDs
    });

    await newPlaylist.save();

    // Use APIResponse for success
    res.status(201).json(new APIResponse(201, { playlist: newPlaylist }, 'Playlist created successfully'));
});

// --- Get Playlist by ID ---
// Public or protected based on playlist visibility
export const getPlaylistById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user; // Get user from auth middleware 
    const { playlistId } = req.params;

    // Use ApiError for validation failures
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID format');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and populate owner and video details
    const playlist = await Playlist.findOne({
            _id: playlistId,
            owner: user?._id
        })
        .populate('owner', 'username fullname avatarUrl') // Populate owner details
        .populate('videoIds', 'title thumbnailUrl duration owner views createdAt'); // Populate video details (select specific fields)

    // Use ApiError if playlist not found
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }
    res.status(200).json(new APIResponse(200, playlist , 'Playlist fetched successfully'));
});


// --- Update Playlist ---
// Requires authentication and ownership
export const updatePlaylist = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user;
    const { playlistId } = req.params;
    const updates = req.body; 

    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID format');
    }

    // Basic validation for updates
    if (!updates || Object.keys(updates).length === 0) {
        throw new ApiError(400, 'No updates provided');
    }
    // Define allowed update fields
    const allowedUpdates = ['name']; // Only allow updating the name for now
    const isValidOperation = Object.keys(updates).every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        throw new ApiError(400, 'Invalid updates: Only name is allowed');
    }
    if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
        throw new ApiError(400, 'Playlist name cannot be empty');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = await Playlist.findOne({ _id: playlistId, owner: user._id });

    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found or you are not the owner');
    }

    // Apply updates
    if (updates.name !== undefined) playlist.name = updates.name.trim();
    // Apply other updatable fields

    await playlist.save();

    // Use APIResponse for success
    res.status(200).json(new APIResponse(200, playlist, 'Playlist updated successfully'));
});

// --- Delete Playlist ---
// Requires authentication and ownership
export const deletePlaylist = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user;
    const { playlistId } = req.params;

    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID format');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = await Playlist.findOne({ _id: playlistId, owner: user._id });

    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found or you are not the owner');
    }

    // Delete the playlist document from MongoDB
    await Playlist.deleteOne({ _id: playlistId });

    // Use APIResponse for success (data is null for deletion)
    res.status(200).json(new APIResponse(200, null, 'Playlist deleted successfully'));
});

// --- Add Video to Playlist ---
// Requires authentication and playlist ownership
export const addVideoToPlaylist = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user;
    const { playlistId } = req.params;
    const { videoId } = req.body;

    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID format');
    }
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'Invalid video ID format');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = await Playlist.findOne({ _id: playlistId, owner: user._id });

    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found or you are not the owner');
    }

    // Ensure the video exists
    const video = await Video.findById(videoId);
    // Use ApiError if video not found
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    // Check if the video is already in the playlist
    // Use APIResponse for informational response if already exists
    if (playlist.videoIds.includes(new mongoose.Types.ObjectId(videoId))) {
        // Optionally populate the playlist before sending the response
         const populatedPlaylist = await Playlist.findById(playlist._id)
             .populate('owner', 'username fullname avatarUrl')
             .populate('videoIds', 'title thumbnailUrl duration owner views');

        res.status(200).json(new APIResponse(200, { playlist: populatedPlaylist }, 'Video already in playlist'));
        return; // Stop execution after sending response
    }

    // Add the video ID to the playlist's videoIds array
    playlist.videoIds.push(new mongoose.Types.ObjectId(videoId));
    await playlist.save();

    // Populate the updated playlist for the response
    const updatedPlaylist = await Playlist.findById(playlist._id)
        .populate('owner', 'username fullname avatarUrl')
        .populate('videoIds', 'title thumbnailUrl duration owner views'); // Populate video details

    // Use APIResponse for success
    res.status(200).json(new APIResponse(200, updatedPlaylist, 'Video added to playlist'));
});

// --- Remove Video from Playlist ---
// Requires authentication and playlist ownership
export const removeVideoFromPlaylist = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user;
    const { playlistId, videoId } = req.params; // Get both IDs from params

    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'Invalid video ID format');
    }

    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = await Playlist.findOne({ _id: playlistId, owner: user._id });

    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found or you are not the owner');
    }

    // Check if the video is in the playlist
    const videoIndex = playlist.videoIds.findIndex(id => id.equals(new mongoose.Types.ObjectId(videoId)));

     // Use APIResponse for informational response if video not found in playlist
    if (videoIndex === -1) {
         // Optionally populate the playlist before sending the response
         const populatedPlaylist = await Playlist.findById(playlist._id)
             .populate('owner', 'username fullname avatarUrl')
             .populate('videoIds', 'title thumbnailUrl duration owner views');

        res.status(200).json(new APIResponse(200, populatedPlaylist, 'Video not found in playlist'));
        return; // Stop execution after sending response
    }

    // Remove the video ID from the playlist's videoIds array
    playlist.videoIds.splice(videoIndex, 1); // Remove by index
    await playlist.save();

    // Populate the updated playlist for the response
    const updatedPlaylist = await Playlist.findById(playlist._id)
        .populate('owner', 'username fullname avatarUrl')
        .populate('videoIds', 'title thumbnailUrl duration owner views'); // Populate video details

    // Use APIResponse for success
    res.status(200).json(new APIResponse(200, updatedPlaylist , 'Video removed from playlist'));
});