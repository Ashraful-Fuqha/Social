import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  video: mongoose.Types.ObjectId; 
  ownerDetails: mongoose.Types.ObjectId; 
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  ownerDetails: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
