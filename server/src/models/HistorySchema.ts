// src/models/WatchHistory.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchHistory extends Document {
  user: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  watchedAt: Date;
}

const WatchHistorySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: { type: Date, default: Date.now },
});

const WatchHistory = mongoose.model<IWatchHistory>('WatchHistory', WatchHistorySchema);

export default WatchHistory;