import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './UserSchema';

export interface IVideo extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  videoFilePublicId: string
  thumbnailUrl?: string; 
  thumbnailPublicId: string | null;
  ownerDetails: IUser; 
  views: number;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  comments : mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  duration: number; 
}

const VideoSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  ownerDetails: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
});

VideoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Video = mongoose.model<IVideo>('Video', VideoSchema);

export default Video;
