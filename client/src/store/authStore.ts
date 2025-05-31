import { create } from 'zustand';
import { type IUser, type WatchHistoryResponse } from './api/mutations';

export interface Playlist {
  _id: string; 
  name: string;
  videoIds: string[]; 
}

// Define the shape of your authentication state
interface AuthState {
  isLoggedIn: boolean;
  user: IUser | null; 
  error: string | null;
  success: boolean; 

  likedVideos: string[];
  dislikedVideos: string[]
  subscribedChannels: string[]; 
  subscribedByChannels: string[];
  watchLater: string[]

  playlists: Playlist[];
  watchHistory: WatchHistoryResponse[]
}

interface AuthActions {
  setLoggedIn: (user: IUser | null) => void;
  setLoggedOut: () => void;

  // Actions for video interactions
  setLikedVideos: (videoIds: string[]) => void;
  addLikedVideos: (videoId: string) => void;
  addDislikedVideos: (videoId: string) => void;
  removeLikedVideo: (videoId: string) => void;
  removeDislikedVideo: (videoId: string) => void;
  setSubscribedChannels: (channels: string[]) => void; 
  addSubscription: (channelId: string) => void;
  removeSubscription: (channelId: string) => void;
  setSubscribedByChannels:(channels: string[]) => void;

  // Actions for playlist management
  setPlaylists: (playlists: Playlist[]) => void; 
  addPlaylist: (playlist: Playlist) => void; 
  removePlaylist: (playlistId: string) => void; 
  addVideoToPlaylist: (playlistId: string, videoId: string) => void; 
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void; 
  updatePlaylist: (playlist: Playlist) => void; 

  setWatchLater: (watchLater: string[]) => void;
  addToWatchLaterStore: (videoId: string) => void;
  removeFromWatchLaterStore: (videoId: string) => void;
  setHistory: (history : WatchHistoryResponse[]) => void;
  addToHistory: (history: WatchHistoryResponse) => void;
  removeFromHistory: (history: string) => void
}

// Combine state and actions into the store type
type AuthStore = AuthState & AuthActions;

// Create the Zustand store
export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  isLoggedIn: false,
  user: null,
  error: null,
  success: false,
  likedVideos: [], // Initialize with empty arrays
  dislikedVideos:[],
  subscribedChannels: [],
  subscribedByChannels:[],
  playlists: [],
  watchHistory: [],
  watchLater: [],

  // Actions
  setLoggedIn: (user) => set({ isLoggedIn: true, user, error: null }),
  setLoggedOut: () => set({
        isLoggedIn: false,
        user: null,
        error: null, // Clear error on logout
        likedVideos: [], // Clear liked videos
        dislikedVideos:[],
        subscribedChannels: [], // Clear subscriptions
        subscribedByChannels: [],
        playlists: [], // Clear playlists
        watchHistory: [],
        watchLater: [],
  }),

  // Actions for video interactions
  setLikedVideos: (videoIds: string[]) => set(() => ({
    likedVideos: [...videoIds],
  })),
  addDislikedVideos: (videoId: string) => set((state) => ({
    dislikedVideos: [...state.dislikedVideos, videoId],
  })),
  addLikedVideos: (videoId: string) => set((state) => ({
    likedVideos: [...state.likedVideos, videoId]
  })),
  removeLikedVideo: (videoId) => set((state) => ({
    likedVideos: state.likedVideos.filter((id) => id !== videoId),
  })),
  removeDislikedVideo: (videoId: string) => set((state) => ({
    dislikedVideos: state.dislikedVideos.filter((id) => id !== videoId),
  })),
  setSubscribedChannels: (channels) => set({ subscribedChannels: channels }), 
  addSubscription: (channelId) => set((state) => ({ 
    subscribedChannels: [...state.subscribedChannels, channelId] 
  })),
  removeSubscription: (channelId) => set((state) => ({ 
    subscribedChannels: state.subscribedChannels.filter((id) => id !== channelId) 
  })),
  setSubscribedByChannels: (channels) => set({subscribedByChannels: channels}),
  // Actions for playlist management
  setPlaylists: (playlists) => set({ playlists }), // Set all playlists
  addPlaylist: (playlist) => set((state) => ({
    playlists: [...state.playlists, playlist],
  })),
  removePlaylist: (playlistId) => set((state) => ({
    playlists: state.playlists.filter((playlist) => playlist._id !== playlistId),
  })),
  addVideoToPlaylist: (playlistId, videoId) => set((state) => ({
    playlists: state.playlists.map((playlist) =>
      playlist._id === playlistId
        ? { ...playlist, videoIds: [...playlist.videoIds, videoId] }
        : playlist
    ),
  })),
  removeVideoFromPlaylist: (playlistId, videoId) => set((state) => ({
    playlists: state.playlists.map((playlist) =>
      playlist._id === playlistId
        ? { ...playlist, videoIds: playlist.videoIds.filter((id) => id !== videoId) }
        : playlist
    ),
  })),
   updatePlaylist: (updatedPlaylist) => set((state) => ({
    playlists: state.playlists.map((playlist) =>
      playlist._id === updatedPlaylist._id ? updatedPlaylist : playlist
    ),
  })),

  setWatchLater: (watchLater) => set({ watchLater }),
  addToWatchLaterStore: (videoId) => set((state) => ({
    watchLater: [...state.watchLater, videoId],
  })),
  removeFromWatchLaterStore: (videoId) => set((state) => ({
    watchLater: state.watchLater.filter((id) => id !== videoId),
  })),

  setHistory : (watchHistory) => set({ watchHistory }),
  addToHistory: (watchHistory) => set((state) => ({
    watchHistory: [...state.watchHistory, watchHistory],
  })),
  removeFromHistory: (videoId) => set((state) => ({
    watchHistory: state.watchHistory.filter((video) => video._id !== videoId),
  }))


}));
