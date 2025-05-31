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
exports.toggleSubscription = exports.deleteComment = exports.updateComment = exports.addComment = exports.toggleDislikeVideo = exports.toggleLikeVideo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VideoSchema_1 = __importDefault(require("../models/VideoSchema"));
const CommentSchema_1 = __importDefault(require("../models/CommentSchema"));
const UserSchema_1 = __importDefault(require("../models/UserSchema"));
const asyncHandler_1 = require("../utils/asyncHandler");
const APIError_1 = require("../utils/APIError");
const APIResponse_1 = require("../utils/APIResponse");
// --- Like/Unlike Video ---
// Requires authentication and user in DB (handled by middleware)
exports.toggleLikeVideo = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { videoId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    if (!user) {
        throw new APIError_1.ApiError(401, 'Authentication required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID');
    }
    if (!action || !['like', 'unlike'].includes(action)) {
        throw new APIError_1.ApiError(400, 'Invalid action. Must be "like" or "unlike"');
    }
    const video = yield VideoSchema_1.default.findById(videoId);
    if (!video) {
        throw new APIError_1.ApiError(404, 'Video not found');
    }
    const userIdObjectId = new mongoose_1.default.Types.ObjectId(user._id);
    const hasLiked = video.likes.some(likeId => likeId.equals(userIdObjectId));
    const hasDisliked = video.dislikes.some(dislikeId => dislikeId.equals(userIdObjectId));
    if (action === 'like') {
        // LIKE ACTION
        if (hasLiked) {
            return res.status(400).json(new APIResponse_1.APIResponse(400, null, 'Video already liked'));
        }
        // Remove dislike if present
        if (hasDisliked) {
            video.dislikes = video.dislikes.filter(dislikeId => !dislikeId.equals(userIdObjectId));
            user.dislikedVideos = user.dislikedVideos.filter((id) => id !== videoId);
        }
        // Add like
        video.likes.push(userIdObjectId);
        user.likedVideos.push(videoId);
        yield video.save();
        yield user.save();
        res.status(200).json(new APIResponse_1.APIResponse(200, { isLiked: true, isDisliked: false }, 'Video liked successfully'));
    }
    else if (action === 'unlike') {
        // UNLIKE ACTION
        if (!hasLiked) {
            return res.status(400).json(new APIResponse_1.APIResponse(400, null, 'Video not liked'));
        }
        // Remove like
        video.likes = video.likes.filter(likeId => !likeId.equals(userIdObjectId));
        user.likedVideos = user.likedVideos.filter((id) => id !== videoId);
        yield video.save();
        yield user.save();
        res.status(200).json(new APIResponse_1.APIResponse(200, { isLiked: false }, 'Video unliked successfully'));
    }
}));
exports.toggleDislikeVideo = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { videoId } = req.params;
    const { action } = req.body; // 'dislike' or 'undislike'
    if (!user) {
        throw new APIError_1.ApiError(401, 'Authentication required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID');
    }
    if (!action || !['dislike', 'undislike'].includes(action)) {
        throw new APIError_1.ApiError(400, 'Invalid action. Must be "dislike" or "undislike"');
    }
    const video = yield VideoSchema_1.default.findById(videoId);
    if (!video) {
        throw new APIError_1.ApiError(404, 'Video not found');
    }
    const userIdObjectId = new mongoose_1.default.Types.ObjectId(user._id);
    const hasLiked = video.likes.some(likeId => likeId.equals(userIdObjectId));
    const hasDisliked = video.dislikes.some(dislikeId => dislikeId.equals(userIdObjectId));
    if (action === 'dislike') {
        // DISLIKE ACTION
        if (hasDisliked) {
            return res.status(400).json(new APIResponse_1.APIResponse(400, null, 'Video already disliked'));
        }
        // Remove like if present
        if (hasLiked) {
            video.likes = video.likes.filter(likeId => !likeId.equals(userIdObjectId));
            user.likedVideos = user.likedVideos.filter((id) => id !== videoId);
        }
        // Add dislike
        video.dislikes.push(userIdObjectId);
        user.dislikedVideos.push(videoId);
        yield video.save();
        yield user.save();
        res.status(200).json(new APIResponse_1.APIResponse(200, { isDisliked: true, isLiked: false }, 'Video disliked successfully'));
    }
    else if (action === 'undislike') {
        // UNDISLIKE ACTION
        if (!hasDisliked) {
            return res.status(400).json(new APIResponse_1.APIResponse(400, null, 'Video not disliked'));
        }
        // Remove dislike
        video.dislikes = video.dislikes.filter(dislikeId => !dislikeId.equals(userIdObjectId));
        user.dislikedVideos = user.dislikedVideos.filter((id) => id !== videoId);
        yield video.save();
        yield user.save();
        res.status(200).json(new APIResponse_1.APIResponse(200, { isDisliked: false }, 'Video undisliked successfully'));
    }
}));
// --- Add Comment ---
// Requires authentication and user in DB (handled by middleware)
exports.addComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user; // User document from findOrCreateUser middleware
    const { videoId } = req.params;
    const { content } = req.body;
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(401, 'Invalid VideoId');
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new APIError_1.ApiError(401, 'Comment is required');
    }
    try {
        // Find the video to ensure it exists
        const video = yield VideoSchema_1.default.findById(videoId);
        if (!video) {
            throw new APIError_1.ApiError(401, 'Video not found');
        }
        // Create a new comment document
        const newComment = new CommentSchema_1.default({
            video: video._id,
            ownerDetails: user._id,
            content: content.trim(),
        });
        yield newComment.save();
        video.comments.push(new mongoose_1.default.Types.ObjectId(newComment._id));
        yield video.save();
        // Populate owner details for the response before sending
        const populatedComment = yield CommentSchema_1.default.findById(newComment._id)
            .populate('ownerDetails', '_id username fullname avatarUrl');
        res.status(201).json(new APIResponse_1.APIResponse(201, populatedComment, 'Video uploaded successfully'));
    }
    catch (error) {
        console.error('Error adding comment:', error);
        throw new APIError_1.ApiError(401, 'Internal server error');
    }
}));
exports.updateComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user; // User document from findOrCreateUser middleware
    const { commentId } = req.params;
    const { content } = req.body;
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(commentId)) {
        throw new APIError_1.ApiError(400, 'Invalid CommentId');
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new APIError_1.ApiError(400, 'Comment content is required');
    }
    try {
        // Find the comment to ensure it exists and belongs to the logged-in user
        const commentToUpdate = yield CommentSchema_1.default.findById(commentId);
        if (!commentToUpdate) {
            throw new APIError_1.ApiError(404, 'Comment not found');
        }
        const commentUserId = String(commentToUpdate.ownerDetails._id);
        const currentUserId = String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        // Check if the logged-in user is the owner of the comment
        if (commentUserId !== currentUserId) {
            throw new APIError_1.ApiError(403, 'You do not have permission to update this comment');
        }
        // Update the comment content
        commentToUpdate.content = content.trim();
        yield commentToUpdate.save();
        // Populate owner details for the response
        const populatedComment = yield CommentSchema_1.default.findById(commentId)
            .populate('ownerDetails', 'username fullname avatarUrl');
        res.status(200).json(new APIResponse_1.APIResponse(200, populatedComment, 'Comment updated successfully'));
    }
    catch (error) {
        console.error('Error updating comment:', error);
        if (error instanceof APIError_1.ApiError) {
            throw error;
        }
        throw new APIError_1.ApiError(500, 'Internal server error while updating comment');
    }
}));
exports.deleteComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user; // User document from findOrCreateUser middleware
    const { commentId } = req.params;
    if (!user) { // Should be populated by middleware
        throw new APIError_1.ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(commentId)) {
        throw new APIError_1.ApiError(400, 'Invalid CommentId');
    }
    try {
        // Find the comment to ensure it exists and belongs to the logged-in user
        const commentToDelete = yield CommentSchema_1.default.findById(commentId);
        if (!commentToDelete) {
            throw new APIError_1.ApiError(404, 'Comment not found');
        }
        const commentUserId = String(commentToDelete.ownerDetails._id);
        const currentUserId = String((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        // Check if the logged-in user is the owner of the comment
        if (commentUserId !== currentUserId) {
            throw new APIError_1.ApiError(403, 'You do not have permission to delete this comment');
        }
        // Delete the comment
        yield CommentSchema_1.default.findByIdAndDelete(commentId);
        const video = yield mongoose_1.default.model('Video').findByIdAndUpdate(commentToDelete.video, { $pull: { comments: new mongoose_1.default.Types.ObjectId(commentId) } }, { new: true });
        res.status(200).json(new APIResponse_1.APIResponse(200, { deletedCommentId: commentId }, 'Comment deleted successfully'));
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        if (error instanceof APIError_1.ApiError) {
            throw error;
        }
        throw new APIError_1.ApiError(500, 'Internal server error while deleting comment');
    }
}));
// // --- Subscribe/Unsubscribe to Channel ---
// Requires authentication and user in DB (handled by middleware)
exports.toggleSubscription = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subscribingUser = req.user;
    const { channelId } = req.params;
    if (!subscribingUser) {
        throw new APIError_1.ApiError(401, 'Authentication required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(channelId)) {
        throw new APIError_1.ApiError(400, 'Invalid channel ID');
    }
    const channelUser = yield UserSchema_1.default.findById(channelId);
    if (!channelUser) {
        throw new APIError_1.ApiError(404, 'Channel user not found');
    }
    // Ensure we are comparing ObjectIds
    const subscribingUserId = String(subscribingUser._id);
    const channelUserId = String(channelUser._id);
    if (subscribingUserId === channelUserId) {
        throw new APIError_1.ApiError(400, 'Cannot subscribe to your own channel');
    }
    const isAlreadySubscribed = subscribingUser.subscribedChannels.some(subscribedId => subscribedId.equals(channelUserId));
    if (isAlreadySubscribed) {
        subscribingUser.subscribedChannels = subscribingUser.subscribedChannels.filter(subscribedId => !subscribedId.equals(channelUserId));
        channelUser.subscribedByChannels = channelUser.subscribedByChannels.filter(channelId => !channelId.equals(subscribingUserId));
        yield subscribingUser.save();
        yield channelUser.save();
        return res.status(200).json(new APIResponse_1.APIResponse(200, { isSubscribed: false }, 'Unsubscribed successfully'));
    }
    else {
        subscribingUser.subscribedChannels.push(new mongoose_1.default.Types.ObjectId(channelUserId));
        channelUser.subscribedByChannels.push(new mongoose_1.default.Types.ObjectId(subscribingUserId));
        yield subscribingUser.save();
        yield channelUser.save();
        return res.status(200).json(new APIResponse_1.APIResponse(200, subscribingUserId, 'Subscribed successfully'));
    }
}));
