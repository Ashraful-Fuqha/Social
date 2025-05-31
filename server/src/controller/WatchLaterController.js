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
exports.removeFromWatchLater = exports.getUserWatchLater = exports.addToWatchLater = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const APIError_1 = require("../utils/APIError");
const UserSchema_1 = __importDefault(require("../models/UserSchema"));
const mongoose_1 = __importDefault(require("mongoose"));
const APIResponse_1 = require("../utils/APIResponse");
exports.addToWatchLater = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { videoId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID');
    }
    const user = yield UserSchema_1.default.findById(userId);
    if (!user) {
        throw new APIError_1.ApiError(404, 'User not found');
    }
    if (user.watchLater.includes(videoId)) {
        throw new APIError_1.ApiError(409, 'Video is already in your Watch Later list');
    }
    user.watchLater.push(videoId);
    yield user.save();
    return res
        .status(200)
        .json(new APIResponse_1.APIResponse(200, videoId, 'Video added to Watch Later'));
}));
exports.getUserWatchLater = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        throw new APIError_1.ApiError(404, 'User not found');
    }
    return res
        .status(200)
        .json(new APIResponse_1.APIResponse(200, user.watchLater, 'User Watch Later list fetched successfully'));
}));
exports.removeFromWatchLater = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { videoId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new APIError_1.ApiError(401, 'User not authenticated');
    }
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new APIError_1.ApiError(400, 'Invalid video ID format');
    }
    const user = yield UserSchema_1.default.findById(userId);
    if (!user) {
        throw new APIError_1.ApiError(404, 'User not found');
    }
    user.watchLater = user.watchLater.filter((id) => id !== videoId);
    yield user.save();
    return res
        .status(200)
        .json(new APIResponse_1.APIResponse(200, videoId, 'Video removed from Watch Later'));
}));
