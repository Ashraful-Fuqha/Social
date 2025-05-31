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
exports.removeVideoFromPlaylist = exports.addVideoToPlaylist = exports.deletePlaylist = exports.updatePlaylist = exports.getPlaylistById = exports.createPlaylist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlaylistSchema_1 = __importDefault(require("../models/PlaylistSchema"));
const VideoSchema_1 = __importDefault(require("../models/VideoSchema"));
const asyncHandler_1 = require("../utils/asyncHandler");
const APIError_1 = require("../utils/APIError");
const APIResponse_1 = require("../utils/APIResponse");
// --- Create Playlist ---
// Requires authentication and user in DB (handled by middleware)
exports.createPlaylist = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { name } = req.body;
    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: User not found in request');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new APIError_1.ApiError(400, 'Playlist name is required');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Create a new playlist document
    const newPlaylist = new PlaylistSchema_1.default({
        name: name.trim(),
        owner: user._id, // Set the owner to the logged-in user's MongoDB ID
        videoIds: [], // Start with an empty array of video IDs
    });
    yield newPlaylist.save();
    // Use APIResponse for success
    res.status(201).json(new APIResponse_1.APIResponse(201, { playlist: newPlaylist }, 'Playlist created successfully'));
}));
// --- Get Playlist by ID ---
// Public or protected based on playlist visibility
exports.getPlaylistById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user; // Get user from auth middleware 
    const { playlistId } = req.params;
    // Use ApiError for validation failures
    if (!mongoose_1.default.Types.ObjectId.isValid(playlistId)) {
        throw new APIError_1.ApiError(400, 'Invalid playlist ID format');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and populate owner and video details
    const playlist = yield PlaylistSchema_1.default.findOne({
        _id: playlistId,
        owner: user === null || user === void 0 ? void 0 : user._id
    })
        .populate('owner', 'username fullname avatarUrl') // Populate owner details
        .populate('videoIds', 'title thumbnailUrl duration owner views createdAt'); // Populate video details (select specific fields)
    // Use ApiError if playlist not found
    if (!playlist) {
        throw new APIError_1.ApiError(404, 'Playlist not found');
    }
    res.status(200).json(new APIResponse_1.APIResponse(200, playlist, 'Playlist fetched successfully'));
}));
// --- Update Playlist ---
// Requires authentication and ownership
exports.updatePlaylist = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { playlistId } = req.params;
    const updates = req.body;
    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(playlistId)) {
        throw new APIError_1.ApiError(400, 'Invalid playlist ID format');
    }
    // Basic validation for updates
    if (!updates || Object.keys(updates).length === 0) {
        throw new APIError_1.ApiError(400, 'No updates provided');
    }
    // Define allowed update fields
    const allowedUpdates = ['name']; // Only allow updating the name for now
    const isValidOperation = Object.keys(updates).every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        throw new APIError_1.ApiError(400, 'Invalid updates: Only name is allowed');
    }
    if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
        throw new APIError_1.ApiError(400, 'Playlist name cannot be empty');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = yield PlaylistSchema_1.default.findOne({ _id: playlistId, owner: user._id });
    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new APIError_1.ApiError(404, 'Playlist not found or you are not the owner');
    }
    // Apply updates
    if (updates.name !== undefined)
        playlist.name = updates.name.trim();
    // Apply other updatable fields
    yield playlist.save();
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, playlist, 'Playlist updated successfully'));
}));
// --- Delete Playlist ---
// Requires authentication and ownership
exports.deletePlaylist = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { playlistId } = req.params;
    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(playlistId)) {
        throw new APIError_1.ApiError(400, 'Invalid playlist ID format');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = yield PlaylistSchema_1.default.findOne({ _id: playlistId, owner: user._id });
    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new APIError_1.ApiError(404, 'Playlist not found or you are not the owner');
    }
    // Delete the playlist document from MongoDB
    yield PlaylistSchema_1.default.deleteOne({ _id: playlistId });
    // Use APIResponse for success (data is null for deletion)
    res.status(200).json(new APIResponse_1.APIResponse(200, null, 'Playlist deleted successfully'));
}));
// --- Add Video to Playlist ---
// Requires authentication and playlist ownership
exports.addVideoToPlaylist = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { playlistId } = req.params;
    const { videoId } = req.body;
    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(playlistId)) {
        throw new APIError_1.ApiError(400, 'Invalid playlist ID format');
    }
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID format');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = yield PlaylistSchema_1.default.findOne({ _id: playlistId, owner: user._id });
    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new APIError_1.ApiError(404, 'Playlist not found or you are not the owner');
    }
    // Ensure the video exists
    const video = yield VideoSchema_1.default.findById(videoId);
    // Use ApiError if video not found
    if (!video) {
        throw new APIError_1.ApiError(404, 'Video not found');
    }
    // Check if the video is already in the playlist
    // Use APIResponse for informational response if already exists
    if (playlist.videoIds.includes(new mongoose_1.default.Types.ObjectId(videoId))) {
        // Optionally populate the playlist before sending the response
        const populatedPlaylist = yield PlaylistSchema_1.default.findById(playlist._id)
            .populate('owner', 'username fullname avatarUrl')
            .populate('videoIds', 'title thumbnailUrl duration owner views');
        res.status(200).json(new APIResponse_1.APIResponse(200, { playlist: populatedPlaylist }, 'Video already in playlist'));
        return; // Stop execution after sending response
    }
    // Add the video ID to the playlist's videoIds array
    playlist.videoIds.push(new mongoose_1.default.Types.ObjectId(videoId));
    yield playlist.save();
    // Populate the updated playlist for the response
    const updatedPlaylist = yield PlaylistSchema_1.default.findById(playlist._id)
        .populate('owner', 'username fullname avatarUrl')
        .populate('videoIds', 'title thumbnailUrl duration owner views'); // Populate video details
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, updatedPlaylist, 'Video added to playlist'));
}));
// --- Remove Video from Playlist ---
// Requires authentication and playlist ownership
exports.removeVideoFromPlaylist = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { playlistId, videoId } = req.params; // Get both IDs from params
    // Use ApiError for validation failures
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: User not found in request');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(playlistId)) {
        throw new APIError_1.ApiError(400, 'Invalid playlist ID format');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID format');
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find the playlist and ensure the logged-in user is the owner
    const playlist = yield PlaylistSchema_1.default.findOne({ _id: playlistId, owner: user._id });
    // Use ApiError if playlist not found or not owned by user
    if (!playlist) {
        throw new APIError_1.ApiError(404, 'Playlist not found or you are not the owner');
    }
    // Check if the video is in the playlist
    const videoIndex = playlist.videoIds.findIndex(id => id.equals(new mongoose_1.default.Types.ObjectId(videoId)));
    // Use APIResponse for informational response if video not found in playlist
    if (videoIndex === -1) {
        // Optionally populate the playlist before sending the response
        const populatedPlaylist = yield PlaylistSchema_1.default.findById(playlist._id)
            .populate('owner', 'username fullname avatarUrl')
            .populate('videoIds', 'title thumbnailUrl duration owner views');
        res.status(200).json(new APIResponse_1.APIResponse(200, populatedPlaylist, 'Video not found in playlist'));
        return; // Stop execution after sending response
    }
    // Remove the video ID from the playlist's videoIds array
    playlist.videoIds.splice(videoIndex, 1); // Remove by index
    yield playlist.save();
    // Populate the updated playlist for the response
    const updatedPlaylist = yield PlaylistSchema_1.default.findById(playlist._id)
        .populate('owner', 'username fullname avatarUrl')
        .populate('videoIds', 'title thumbnailUrl duration owner views'); // Populate video details
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, updatedPlaylist, 'Video removed from playlist'));
}));
