import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string; 
  username: string;
  email: string;
  fullname?: string;
  avatarUrl?: string;
  subscribedChannels: mongoose.Types.ObjectId[]
  subscribedByChannels: mongoose.Types.ObjectId[]
  likedVideos: string[]
  dislikedVideos: string[]
  watchLater: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullname: { type: String }, 
  avatarUrl: { type: String },
  subscribedChannels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscribedByChannels: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likedVideos: {type: [String]},
  dislikedVideos: {type: [String]},
  watchLater: { type: [String]},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;


