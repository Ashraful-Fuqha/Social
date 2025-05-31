import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Video from '../models/VideoSchema'; 
import Comment from '../models/CommentSchema'; 
import User from '../models/UserSchema';
import { IAuthRequest } from '../middlewares/AuthMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/APIError';
import { APIResponse } from '../utils/APIResponse';


// --- Like/Unlike Video ---
// Requires authentication and user in DB (handled by middleware)
export const toggleLikeVideo = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user;
  const { videoId } = req.params;
  const { action } = req.body; // 'like' or 'unlike'

  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  if (!action || !['like', 'unlike'].includes(action)) {
    throw new ApiError(400, 'Invalid action. Must be "like" or "unlike"');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const userIdObjectId = new mongoose.Types.ObjectId(user._id as string);
  const hasLiked = video.likes.some(likeId => likeId.equals(userIdObjectId));
  const hasDisliked = video.dislikes.some(dislikeId => dislikeId.equals(userIdObjectId));

  if (action === 'like') {
    // LIKE ACTION
    if (hasLiked) {
      return res.status(400).json(new APIResponse(400, null, 'Video already liked'));
    }

    // Remove dislike if present
    if (hasDisliked) {
      video.dislikes = video.dislikes.filter(dislikeId => !dislikeId.equals(userIdObjectId));
      user.dislikedVideos = user.dislikedVideos.filter((id: string) => id !== videoId);
    }

    // Add like
    video.likes.push(userIdObjectId);
    user.likedVideos.push(videoId);
    
    await video.save();
    await user.save();
    
    res.status(200).json(new APIResponse(200, { isLiked: true, isDisliked: false }, 'Video liked successfully'));
    
  } else if (action === 'unlike') {
    // UNLIKE ACTION
    if (!hasLiked) {
      return res.status(400).json(new APIResponse(400, null, 'Video not liked'));
    }

    // Remove like
    video.likes = video.likes.filter(likeId => !likeId.equals(userIdObjectId));
    user.likedVideos = user.likedVideos.filter((id: string) => id !== videoId);
    
    await video.save();
    await user.save();
    
    res.status(200).json(new APIResponse(200, { isLiked: false }, 'Video unliked successfully'));
  }
});

export const toggleDislikeVideo = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user;
  const { videoId } = req.params;
  const { action } = req.body; // 'dislike' or 'undislike'

  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  if (!action || !['dislike', 'undislike'].includes(action)) {
    throw new ApiError(400, 'Invalid action. Must be "dislike" or "undislike"');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const userIdObjectId = new mongoose.Types.ObjectId(user._id as string);
  const hasLiked = video.likes.some(likeId => likeId.equals(userIdObjectId));
  const hasDisliked = video.dislikes.some(dislikeId => dislikeId.equals(userIdObjectId));

  if (action === 'dislike') {
    // DISLIKE ACTION
    if (hasDisliked) {
      return res.status(400).json(new APIResponse(400, null, 'Video already disliked'));
    }

    // Remove like if present
    if (hasLiked) {
      video.likes = video.likes.filter(likeId => !likeId.equals(userIdObjectId));
      user.likedVideos = user.likedVideos.filter((id: string) => id !== videoId);
    }

    // Add dislike
    video.dislikes.push(userIdObjectId);
    user.dislikedVideos.push(videoId);
    
    await video.save();
    await user.save();
    
    res.status(200).json(new APIResponse(200, { isDisliked: true, isLiked: false }, 'Video disliked successfully'));
    
  } else if (action === 'undislike') {
    // UNDISLIKE ACTION
    if (!hasDisliked) {
      return res.status(400).json(new APIResponse(400, null, 'Video not disliked'));
    }

    // Remove dislike
    video.dislikes = video.dislikes.filter(dislikeId => !dislikeId.equals(userIdObjectId));
    user.dislikedVideos = user.dislikedVideos.filter((id: string) => id !== videoId);
    
    await video.save();
    await user.save();
    
    res.status(200).json(new APIResponse(200, { isDisliked: false }, 'Video undisliked successfully'));
  }
});

// --- Add Comment ---
// Requires authentication and user in DB (handled by middleware)
export const addComment = asyncHandler( async (req: IAuthRequest, res: Response) => {
    const user = req.user; // User document from findOrCreateUser middleware
    const { videoId } = req.params;
    const { content } = req.body;

    if (!user) { // Should be populated by middleware
      throw new ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }
     if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(401, 'Invalid VideoId');
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ApiError(401, 'Comment is required');
    }

    try {
        // Find the video to ensure it exists
        const video = await Video.findById(videoId);
        if (!video) {
          throw new ApiError(401, 'Video not found');
        }

        // Create a new comment document
        const newComment = new Comment({
            video: video._id,
            ownerDetails: user._id,
            content: content.trim(),
        });

        await newComment.save();

        video.comments.push(new mongoose.Types.ObjectId(newComment._id as string));
        
        await video.save();

        // Populate owner details for the response before sending
        const populatedComment = await Comment.findById(newComment._id)
            .populate('ownerDetails', '_id username fullname avatarUrl');


        res.status(201).json(new APIResponse(201, populatedComment , 'Video uploaded successfully'));

    } catch (error) {
        console.error('Error adding comment:', error);
        throw new ApiError(401, 'Internal server error');
    }
});

export const updateComment = asyncHandler(async( req: IAuthRequest, res: Response) => {
    const user = req.user; // User document from findOrCreateUser middleware
    const { commentId } = req.params;
    const { content } = req.body;

    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, 'Invalid CommentId');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new ApiError(400, 'Comment content is required');
    }

    try {
        // Find the comment to ensure it exists and belongs to the logged-in user
        const commentToUpdate = await Comment.findById(commentId);

        if (!commentToUpdate) {
            throw new ApiError(404, 'Comment not found');
        }
        const commentUserId = String(commentToUpdate.ownerDetails._id)
        const currentUserId = String(req.user?._id)
        // Check if the logged-in user is the owner of the comment
        if (commentUserId !== currentUserId) {
            
            throw new ApiError(403, 'You do not have permission to update this comment');
        }

        // Update the comment content
        commentToUpdate.content = content.trim();
        await commentToUpdate.save();

        // Populate owner details for the response
        const populatedComment = await Comment.findById(commentId)
            .populate('ownerDetails', 'username fullname avatarUrl');

        res.status(200).json(new APIResponse(200, populatedComment, 'Comment updated successfully'));

    } catch (error) {
        console.error('Error updating comment:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Internal server error while updating comment');
    }
})

export const deleteComment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const user = req.user; // User document from findOrCreateUser middleware
    const { commentId } = req.params;

    if (!user) { // Should be populated by middleware
        throw new ApiError(401, 'Authentication required: Clerk User ID not found in request auth');
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, 'Invalid CommentId');
    }

    try {
        // Find the comment to ensure it exists and belongs to the logged-in user
        const commentToDelete = await Comment.findById(commentId);

        if (!commentToDelete) {
            throw new ApiError(404, 'Comment not found');
        }
        const commentUserId = String(commentToDelete.ownerDetails._id)
        const currentUserId = String(req.user?._id)
        // Check if the logged-in user is the owner of the comment
        if (commentUserId !== currentUserId) {
            throw new ApiError(403, 'You do not have permission to delete this comment');
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);
        const video = await mongoose.model('Video').findByIdAndUpdate(
            commentToDelete.video,
            { $pull: { comments: new mongoose.Types.ObjectId(commentId) } },
            { new: true }
        );

        res.status(200).json(new APIResponse(200, { deletedCommentId: commentId }, 'Comment deleted successfully'));

    } catch (error) {
        console.error('Error deleting comment:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Internal server error while deleting comment');
    }
});

// // --- Subscribe/Unsubscribe to Channel ---
// Requires authentication and user in DB (handled by middleware)
export const toggleSubscription = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const subscribingUser = req.user;
    const { channelId } = req.params;

    if (!subscribingUser) {
        throw new ApiError(401, 'Authentication required');
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }

    const channelUser = await User.findById(channelId);
    if (!channelUser) {
        throw new ApiError(404, 'Channel user not found');
    }

    // Ensure we are comparing ObjectIds
    const subscribingUserId = String(subscribingUser._id)
    const channelUserId = String(channelUser._id)
    if (subscribingUserId === channelUserId) {
        throw new ApiError(400, 'Cannot subscribe to your own channel');
    }

    const isAlreadySubscribed = subscribingUser.subscribedChannels.some(subscribedId =>
        subscribedId.equals(channelUserId)
    );

    if (isAlreadySubscribed) {
        subscribingUser.subscribedChannels = subscribingUser.subscribedChannels.filter(subscribedId =>
            !subscribedId.equals(channelUserId)
        );
        channelUser.subscribedByChannels = channelUser.subscribedByChannels.filter(channelId =>
            !channelId.equals(subscribingUserId)
        );
        await subscribingUser.save();
        await channelUser.save();
        return res.status(200).json(new APIResponse(200, { isSubscribed: false }, 'Unsubscribed successfully'));
    } else {
        subscribingUser.subscribedChannels.push(new mongoose.Types.ObjectId(channelUserId));
        
        channelUser.subscribedByChannels.push(new mongoose.Types.ObjectId(subscribingUserId))
        await subscribingUser.save();
        await channelUser.save();
        return res.status(200).json(new APIResponse(200, subscribingUserId, 'Subscribed successfully'));
    }
});