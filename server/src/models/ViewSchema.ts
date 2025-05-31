import mongoose, { Schema, Document } from 'mongoose';

export interface IView extends Document {
  userId?: mongoose.Types.ObjectId; 
  videoId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ViewSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  createdAt: { type: Date, default: Date.now },
});

const View = mongoose.model<IView>('View', ViewSchema);

export default View;