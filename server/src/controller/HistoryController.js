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
exports.removeFromWatchHistory = exports.getUserWatchHistory = exports.addToWatchHistory = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const APIError_1 = require("../utils/APIError");
const HistorySchema_1 = __importDefault(require("../models/HistorySchema"));
const VideoSchema_1 = __importDefault(require("../models/VideoSchema"));
const mongoose_1 = __importDefault(require("mongoose"));
const APIResponse_1 = require("../utils/APIResponse");
exports.addToWatchHistory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { videoId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID');
    }
    const video = yield VideoSchema_1.default.findById(videoId);
    if (!video) {
        throw new APIError_1.ApiError(404, 'Video not found');
    }
    const existingHistory = yield HistorySchema_1.default.findOne({ user: userId, video: videoId });
    if (existingHistory) {
        existingHistory.watchedAt = new Date();
        yield existingHistory.save();
        return res
            .status(200)
            .json(new APIResponse_1.APIResponse(200, existingHistory, 'Watch history updated successfully'));
    }
    else {
        const newHistoryEntry = yield HistorySchema_1.default.create({
            user: userId,
            video: videoId,
        });
        return res
            .status(201)
            .json(new APIResponse_1.APIResponse(201, newHistoryEntry, 'Video added to watch history successfully'));
    }
}));
exports.getUserWatchHistory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    const watchHistory = yield HistorySchema_1.default.find({ user: userId })
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
        .json(new APIResponse_1.APIResponse(200, watchHistory, 'User watch history fetched successfully'));
}));
exports.removeFromWatchHistory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { videoId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID format');
    }
    const deletedHistory = yield HistorySchema_1.default.findOneAndDelete({ user: userId, video: videoId });
    if (!deletedHistory) {
        throw new APIError_1.ApiError(404, 'Video not found in watch history');
    }
    return res
        .status(200)
        .json(new APIResponse_1.APIResponse(200, deletedHistory, 'Video removed from watch history successfully'));
}));
