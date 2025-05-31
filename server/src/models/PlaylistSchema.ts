import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  owner: mongoose.Types.ObjectId; 
  videoIds: mongoose.Types.ObjectId[]; 
}

const PlaylistSchema: Schema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoIds: [{ type: Schema.Types.ObjectId, ref: 'Video' } ],
});

PlaylistSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

export default Playlist;
