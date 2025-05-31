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
exports.deleteVideo = exports.updateVideo = exports.getVideoComments = exports.getVideosByIds = exports.getVideoById = exports.getVideosByUserId = exports.getAllVideos = exports.getUserLikedVideos = exports.uploadVideo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VideoSchema_1 = __importDefault(require("../models/VideoSchema")); // Import Video model and its type
const UserSchema_1 = __importDefault(require("../models/UserSchema")); // Import User model (for owner population) and type
const CommentSchema_1 = __importDefault(require("../models/CommentSchema")); // Import Comment model for deleting related comments
const PlaylistSchema_1 = __importDefault(require("../models/PlaylistSchema")); // Import Playlist model for cleaning up playlist references
const asyncHandler_1 = require("../utils/asyncHandler");
const APIResponse_1 = require("../utils/APIResponse");
const APIError_1 = require("../utils/APIError"); // Corrected import path for ApiError
// Import your cloud storage service functions
const FileUpload_1 = require("../utils/FileUpload"); // Assuming fileUpload is in utils
const fs_1 = __importDefault(require("fs")); // Needed for local file cleanup if Multer uses disk storage
const ViewSchema_1 = __importDefault(require("../models/ViewSchema"));
// --- Video Upload ---
// This controller will be used after Multer processes the file
exports.uploadVideo = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId; // Clerk ID of the uploader
    const files = req.files; // Files object from Multer
    const { title, description } = req.body; // Other fields from the form
    // --- Validation ---
    if (!clerkUserId) {
        throw new APIError_1.ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
    // Check if video file was uploaded
    if (!files || !files.videoFile || files.videoFile.length === 0) {
        throw new APIError_1.ApiError(400, 'No video file uploaded');
    }
    // Get the video file and optional thumbnail file
    const videoFile = files.videoFile[0];
    const thumbnailFile = files.thumbnailFile && files.thumbnailFile.length > 0 ? files.thumbnailFile[0] : null;
    // Assume Multer saved the file to disk, get the local file paths
    const videoLocalFilePath = videoFile.path;
    const thumbnailLocalFilePath = thumbnailFile === null || thumbnailFile === void 0 ? void 0 : thumbnailFile.path;
    if (!videoLocalFilePath) {
        throw new APIError_1.ApiError(500, 'Multer did not provide a local file path for video');
    }
    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        // Clean up the uploaded files if required fields are missing
        if (fs_1.default.existsSync(videoLocalFilePath)) {
            fs_1.default.unlinkSync(videoLocalFilePath);
        }
        if (thumbnailLocalFilePath && fs_1.default.existsSync(thumbnailLocalFilePath)) {
            fs_1.default.unlinkSync(thumbnailLocalFilePath);
        }
        throw new APIError_1.ApiError(400, 'Title is required');
    }
    // Basic check for duration
    // --- Find User ---
    const user = yield UserSchema_1.default.findOne({ clerkId: clerkUserId });
    if (!user) {
        // Clean up the uploaded files if user not found
        if (fs_1.default.existsSync(videoLocalFilePath)) {
            fs_1.default.unlinkSync(videoLocalFilePath);
        }
        if (thumbnailLocalFilePath && fs_1.default.existsSync(thumbnailLocalFilePath)) {
            fs_1.default.unlinkSync(thumbnailLocalFilePath);
        }
        throw new APIError_1.ApiError(404, 'User not found in database');
    }
    // --- Cloud Storage Upload ---
    // Upload the video file to Cloudinary
    const cloudinaryVideoResponse = yield (0, FileUpload_1.uploadOnCloudinary)(videoLocalFilePath);
    if (!cloudinaryVideoResponse) {
        // uploadOnCloudinary already handles local file cleanup on failure
        throw new APIError_1.ApiError(500, 'Failed to upload video to cloud storage');
    }
    // Upload thumbnail file if provided, or generate one
    let thumbnailUrl = null;
    let thumbnailPublicId = null;
    if (thumbnailLocalFilePath) {
        // If thumbnail was uploaded, use it
        const cloudinaryThumbnailResponse = yield (0, FileUpload_1.uploadOnCloudinary)(thumbnailLocalFilePath);
        if (cloudinaryThumbnailResponse) {
            thumbnailUrl = cloudinaryThumbnailResponse.secure_url;
            thumbnailPublicId = cloudinaryThumbnailResponse.public_id;
        }
        else {
        }
    }
    else {
        // Could generate a thumbnail from the video using Cloudinary transformations
        // This is a simple approach - for more control, use FFmpeg to extract frame first
        if (cloudinaryVideoResponse.resource_type === 'video') {
            thumbnailUrl = cloudinaryVideoResponse.secure_url.replace(/\.[^/.]+$/, ".jpg");
            // Use Cloudinary's URL transformation to generate a thumbnail
            thumbnailUrl = thumbnailUrl.replace('/upload/', '/upload/w_640,h_360,c_fill,q_auto,f_jpg/');
            // Note: This doesn't create a separate public_id for the thumbnail
        }
    }
    const videoDuration = cloudinaryVideoResponse.duration;
    // Basic check to ensure Cloudinary returned a valid duration
    if (typeof videoDuration !== 'number' || videoDuration <= 0) {
        // This is unexpected if Cloudinary uploaded a video successfully
        // You might want to delete the video from Cloudinary here too if possible
        // await deleteFromCloudinary(cloudinaryVideoResponse.public_id, "video"); // Assuming you have a delete utility
        throw new APIError_1.ApiError(500, 'Could not get valid duration from uploaded video');
    }
    // --- Create Video Document ---
    const newVideo = new VideoSchema_1.default({
        title: title.trim(),
        description: description ? description.trim() : undefined,
        videoUrl: cloudinaryVideoResponse.secure_url,
        videoFilePublicId: cloudinaryVideoResponse.public_id,
        thumbnailUrl: thumbnailUrl,
        thumbnailPublicId: thumbnailPublicId,
        ownerDetails: user._id,
        createdAt: Date.now(),
        duration: videoDuration,
        views: 0,
        likes: [],
        dislikes: [],
    });
    yield newVideo.save();
    // --- Send Success Response ---
    res.status(201).json(new APIResponse_1.APIResponse(201, { video: newVideo }, 'Video uploaded successfully'));
}));
exports.getUserLikedVideos = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get the authenticated user's ID from the request object
    // Assuming findOrCreateUser middleware attaches the user document as req.dbUser
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        // This should ideally not happen if requireAuth and findOrCreateUser ran correctly
        throw new APIError_1.ApiError(401, 'User not authenticated or user data not found in request');
    }
    // Find the user and populate their likedVideos
    // Or directly query the Video model for videos whose _id is in the user's likedVideos array
    const userWithLikedVideos = yield UserSchema_1.default.findById(userId).populate('likedVideos');
    if (!userWithLikedVideos) {
        // User somehow disappeared between middleware and controller? Unlikely, but handle.
        throw new APIError_1.ApiError(404, 'Authenticated user not found in database');
    }
    // The liked videos are now in userWithLikedVideos.likedVideos
    const likedVideos = userWithLikedVideos.likedVideos;
    // TODO: Implement pagination/sorting for liked videos if needed
    res.status(200).json(new APIResponse_1.APIResponse(200, likedVideos, 'Liked videos fetched successfully'));
}));
// --- Get All Videos ---
// Supports pagination and optional search query
exports.getAllVideos = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search;
    const skip = (page - 1) * limit;
    const filter = {}; // Use a more specific type if possible, but any is common for Mongoose query objects
    if (searchQuery) {
        filter.$or = [
            { title: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on title
            { description: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on description
            // Add search on channel name if you denormalize it or use aggregation
        ];
    }
    // Removed try/catch as asyncHandler handles async errors
    const videos = yield VideoSchema_1.default.find(filter)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .populate('ownerDetails', 'username fullname avatarUrl'); // Populate owner details
    const totalDocs = yield VideoSchema_1.default.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limit);
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, {
        docs: videos,
        totalDocs,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
    }, 'Videos fetched successfully'));
}));
exports.getVideosByUserId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params; // Get the user ID from the URL parameters
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'Invalid user ID format');
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Removed try/catch as asyncHandler handles async errors
    // Find videos where the owner matches the provided userId
    const videos = yield VideoSchema_1.default.find({ ownerDetails: userId })
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .populate('ownerDetails', 'username fullname avatarUrl'); // Populate ownerDetails details
    const totalDocs = yield VideoSchema_1.default.countDocuments({ ownerDetails: userId });
    const totalPages = Math.ceil(totalDocs / limit);
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, {
        docs: videos,
        totalDocs,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
    }, 'User videos fetched successfully'));
}));
// --- Get Single Video ---
exports.getVideoById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { videoId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID format'); // Changed message for clarity
    }
    const video = yield VideoSchema_1.default.findById(videoId)
        .populate('ownerDetails', 'username fullname avatarUrl'); // Populate owner details
    // We will fetch comments separately using useGetVideoCommentsQuery on the frontend
    if (!video) {
        throw new APIError_1.ApiError(404, 'Video not found');
    }
    if (userId) {
        // Check if this user has already viewed this video
        const existingView = yield ViewSchema_1.default.findOne({ userId, videoId });
        if (!existingView) {
            yield VideoSchema_1.default.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).exec();
            yield ViewSchema_1.default.create({ userId, videoId });
        }
    }
    else {
        // Handle anonymous users using cookies (example)
        const viewedCookieName = `viewed-${videoId}`;
        if (!req.cookies[viewedCookieName]) {
            yield VideoSchema_1.default.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).exec();
            res.cookie(viewedCookieName, 'true', { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        }
    }
    res.status(200).json(new APIResponse_1.APIResponse(200, video, 'Video fetched successfully'));
}));
exports.getVideosByIds = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract the array of video IDs from the request body
    const { videoIds } = req.body;
    // --- Input Validation ---
    // Check if videoIds is provided and is an array
    if (!videoIds || !Array.isArray(videoIds)) {
        throw new APIError_1.ApiError(400, 'An array of video IDs is required in the request body.');
    }
    // Check if the array contains valid Mongoose ObjectIds
    // Use .every() to check all elements
    const areValidObjectIds = videoIds.every(id => mongoose_1.default.Types.ObjectId.isValid(id));
    if (!areValidObjectIds) {
        throw new APIError_1.ApiError(400, 'All provided video IDs must be valid MongoDB ObjectId formats.');
    }
    // Check if the array is empty after validation (optional, but good practice)
    if (videoIds.length === 0) {
        // Return an empty array if no IDs were provided after validation
        return res.status(200).json(new APIResponse_1.APIResponse(200, [], 'No video IDs provided.'));
    }
    // --- Database Query ---
    // Find all videos whose _id is in the provided videoIds array
    // Use the $in operator for querying against an array of values
    const videos = yield VideoSchema_1.default.find({
        _id: { $in: videoIds }
    })
        .populate('ownerDetails', 'username fullname avatar'); // Populate owner details, select relevant fields
    // Note: If some IDs are not found, Mongoose's find will simply not return
    // a document for that ID. It won't throw an error. The frontend
    // should handle the case where the returned array is smaller than the
    // requested array.
    // --- Response ---
    // Use APIResponse for success
    // The 'videos' array will contain only the videos that were found in the database
    res.status(200).json(new APIResponse_1.APIResponse(200, videos, 'Videos fetched successfully'));
}));
// --- Get Comments for a Video ---
exports.getVideoComments = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'Invalid video ID format'); // Changed message for clarity
    }
    // Removed try/catch as asyncHandler handles async errors
    // Find comments for the video and populate the owner details
    const comments = yield CommentSchema_1.default.find({ video: videoId })
        .populate('ownerDetails', 'username fullname avatarUrl createdAt') // Populate owner details
        .sort({ createdAt: 'asc' }); // Sort comments by creation date
    // Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, comments, 'Video comments fetched successfully'));
}));
// --- Update Video ---
// Requires authentication and ownership
exports.updateVideo = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const { videoId } = req.params;
    const updates = req.body; // Fields to update (e.g., title, description)
    // --- Validation ---
    if (!clerkUserId) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(401, 'Authentication required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'Invalid video ID format'); // Changed message for clarity
    }
    // Basic validation for updates
    if (!updates || Object.keys(updates).length === 0) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'No updates provided');
    }
    // Define allowed update fields
    const allowedUpdates = ['title', 'description'];
    const isValidOperation = Object.keys(updates).every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'Invalid video updates: Only title and description are allowed'); // More specific message
    }
    // --- Find User and Video ---
    // Removed try/catch around this section as asyncHandler handles async errors
    // Find the user in your DB
    const user = yield UserSchema_1.default.findOne({ clerkId: clerkUserId });
    if (!user) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(404, 'User not found in database'); // Changed message
    }
    // Find the video and ensure the logged-in user is the ownerDetails
    const video = yield VideoSchema_1.default.findOne({ _id: videoId, ownerDetails: user._id });
    if (!video) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(404, 'Video not found or you are not the owner');
    }
    // --- Apply and Save Updates ---
    // Apply updates
    Object.assign(video, updates); // Mongoose way to apply updates
    yield video.save();
    // --- Send Success Response ---
    // IMPLEMENTED: Use APIResponse for success
    res.status(200).json(new APIResponse_1.APIResponse(200, { video }, 'Video updated successfully'));
}));
// --- Delete Video ---
// Requires authentication and ownership
exports.deleteVideo = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const clerkUserId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const { videoId } = req.params;
    // --- Validation ---
    if (!clerkUserId) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(401, 'Authentication required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(400, 'Invalid video ID format'); // Changed message for clarity
    }
    // --- Find User and Video ---
    // Removed try/catch around this section as asyncHandler handles async errors
    // Find the user in your DB
    const user = yield UserSchema_1.default.findOne({ clerkId: clerkUserId });
    if (!user) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(404, 'User not found in database'); // Changed message
    }
    // Find the video and ensure the logged-in user is the ownerDetails
    const video = yield VideoSchema_1.default.findOne({ _id: videoId, ownerDetails: user._id });
    if (!video) {
        // Throws ApiError, caught by asyncHandler -> global error handler
        throw new APIError_1.ApiError(404, 'Video not found or you are not the owner');
    }
    // --- Cloud Storage Deletion ---
    // IMPLEMENTED: Delete the video file from cloud storage
    if (video.videoFilePublicId) { // Check if public ID exist
        const deleteVideoResult = yield (0, FileUpload_1.deleteImageFromCloudinary)(video.videoFilePublicId);
        if (!deleteVideoResult) {
            console.warn(`Failed to delete video ${video.videoFilePublicId} from Cloudinary.`);
            // Decide if you want to throw an error here or just log and continue
            // For now, we log and continue to ensure DB cleanup happens
        }
    }
    else {
        console.warn(`Video ${videoId} has no Cloudinary public ID stored, skipping cloud deletion.`);
    }
    // IMPLEMENTED: Delete the thumbnail from cloud storage if it exists
    if (video.thumbnailPublicId) { // Check if public ID exists
        const deleteThumbnailResult = yield (0, FileUpload_1.deleteImageFromCloudinary)(video.thumbnailPublicId);
        if (!deleteThumbnailResult) {
            console.warn(`Failed to delete thumbnail ${video.thumbnailPublicId} from Cloudinary.`);
            // Log and continue
        }
    }
    // --- MongoDB Deletion ---
    yield VideoSchema_1.default.deleteOne({ _id: videoId });
    // --- Clean up related data in MongoDB ---
    const commentsDeleteResult = yield CommentSchema_1.default.deleteMany({ video: videoId });
    const usersUpdateResult = yield UserSchema_1.default.updateMany({ $or: [{ likedVideos: video._id }, { dislikedVideos: video._id }] }, { $pull: { likedVideos: video._id, dislikedVideos: video._id } });
    const playlistsUpdateResult = yield PlaylistSchema_1.default.updateMany({ videoIds: video._id }, { $pull: { videoIds: video._id } });
    res.status(200).json(new APIResponse_1.APIResponse(200, null, 'Video deleted successfully'));
}));
