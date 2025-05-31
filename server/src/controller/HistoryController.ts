// src/controllers/watchHistory.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/APIError';
import WatchHistory from '../models/HistorySchema';
import Video from '../models/VideoSchema';
import { IAuthRequest } from '../middlewares/AuthMiddleware';
import mongoose from 'mongoose';
import { APIResponse } from '../utils/APIResponse';

export const addToWatchHistory = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const existingHistory = await WatchHistory.findOne({ user: userId, video: videoId });

  

  if (existingHistory) {
    existingHistory.watchedAt = new Date();
    await existingHistory.save();
    return res
      .status(200)
      .json(new APIResponse(200, existingHistory, 'Watch history updated successfully'));
  } else {
    const newHistoryEntry = await WatchHistory.create({
      user: userId,
      video: videoId,
    });
    return res
      .status(201)
      .json(new APIResponse(201, newHistoryEntry, 'Video added to watch history successfully'));
  }
});

export const getUserWatchHistory = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const watchHistory = await WatchHistory.find({ user: userId })
    .sort({ watchedAt: -1 })
    .populate({
      path: 'video',
      select: 'title thumbnailUrl ownerDetails duration _id views createdAt',
      populate: {
        path: 'ownerDetails',
        select: 'username fullname avatarUrl _id',
      },
    });

  return res
    .status(200)
    .json(new APIResponse(200, watchHistory, 'User watch history fetched successfully'));
});

export const removeFromWatchHistory = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID format');
  }

  const deletedHistory = await WatchHistory.findOneAndDelete({ user: userId, video: videoId });

  if (!deletedHistory) {
    throw new ApiError(404, 'Video not found in watch history');
  }

  return res
    .status(200)
    .json(new APIResponse(200, deletedHistory, 'Video removed from watch history successfully'));
});