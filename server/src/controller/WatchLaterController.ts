import { Request, Response } from 'express';
import { asyncHandler }from '../utils/asyncHandler';
import { ApiError } from '../utils/APIError';
import User from '../models/UserSchema';
import mongoose from 'mongoose';
import { APIResponse } from '../utils/APIResponse';
import { IAuthRequest } from '../middlewares/AuthMiddleware';

export const addToWatchLater = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { videoId } = req.params; 
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.watchLater.includes(videoId)) {
    throw new ApiError(409, 'Video is already in your Watch Later list');
  }

  user.watchLater.push(videoId);
  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, videoId , 'Video added to Watch Later'));
});

export const getUserWatchLater = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new APIResponse(200, user.watchLater, 'User Watch Later list fetched successfully'));
});

export const removeFromWatchLater = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID format');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.watchLater = user.watchLater.filter((id) => id !== videoId);
  await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, videoId , 'Video removed from Watch Later'));
});