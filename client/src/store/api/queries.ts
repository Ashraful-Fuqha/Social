import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from './axios'; // Import the configured Axios instance
import type { AxiosError } from 'axios';
import type { ApiErrorStructure, IUser } from './mutations';
import { useAuthStore } from '../authStore';

// Define common interfaces (adjust based on your backend response)

interface Video {
  _id: string;
  
  title: string;
  thumbnailUrl: string;
  description?: string;
  videoUrl: string; // Added videoUrl for playback
//   owner: string; // Owner ID
  ownerDetails: IUser;
  views: number;
  createdAt: Date;
  duration: number;
  likes: string[]; // Array of user IDs who liked
  dislikes: string[]; // Array of user IDs who disliked
  comments: Comment[]; // Array of comments (or references)
  // Add other video properties
}

interface VideoListPayload {
    docs: Video[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
}

interface VideoListResponse {
  docs: Video[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  // Add other pagination info
}

export interface Comment {
    _id: string;
    video: string; // Video ID
    owner: string; // User ID
    ownerDetails: IUser; // Details of the comment owner
    content: string;
    createdAt: string;
    updatedAt: string;
    // Add other comment properties (e.g., replies)
}

interface Playlist {
  _id: string;
  name: string;
  owner: string; // Owner ID
  videoIds: Video[];
//   videos?: Video[]; // Optional: could embed or populate video details
  // Add other playlist properties
}

export interface WatchHistoryResponse {
  _id: string;
  video: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    ownerDetails: {
      _id: string;
      username: string;
      fullname?: string;
      avatarUrl?: string;
    };
    duration: number;
    views: number; 
    createdAt: string;
  };
  watchedAt: string; // ISO string format
}


export const useGetCurrentUserQuery = () => {
    return useQuery<IUser, AxiosError<ApiErrorStructure>>({
        queryKey: ['currentUser'], // Unique key for this query
        queryFn: async () => { // Use an async function directly in queryFn
            // Make a GET request to your backend endpoint for the current user
            // Using your 'api' instance
            // Assuming your backend endpoint is '/api/v1/users/me' as in your example
            const response = await api.get('/users/me');

            // Assuming your APIResponse structure has a 'data' field containing the actual user object
            // Adjust 'response.data.data' if your API response structure is different
            if (response.data && response.data.success && response.data.data) {
                return response.data.data;
            } else {
                // Handle cases where the API call was successful but the backend indicated an error
                // or the data structure is unexpected.
                // You might want to throw a more specific error based on your APIResponse structure
                 throw new Error(response.data?.message || 'Failed to fetch current user: Unexpected response format');
            }
        },
        staleTime: Infinity, // User data is unlikely to change frequently while logged in
        // cacheTime: Infinity, // Keep user data in cache indefinitely (or until logout)
        // Optional: Add retry: false or specific error handling if you don't want retries on auth errors
        // retry: false,
    });
};

// --- Video Queries ---

// Custom hook to fetch all videos (already exists)
export const useGetAllVideosQuery = (query?: string) => {
  return useQuery<VideoListPayload, AxiosError<ApiErrorStructure>>({
    queryKey: ['videos', query],
    queryFn: async () => {
      const response = await api.get(`/videos/${query || ''}`);
      return response.data.data;
    },
    staleTime: Infinity,
    gcTime: Infinity
  });
};

// Custom hook to fetch a single video by ID
export const useGetVideoByIdQuery = (videoId: string) => {
  const queryClient = useQueryClient()
  return useQuery<Video, Error>({
    queryKey: ['video', videoId], // Unique key for a single video
    queryFn: async () => {
      const response = await api.get(`/videos/${videoId}`); // Adjust endpoint
      queryClient.invalidateQueries({ queryKey : ['videos']})
      return response.data.data;
    },
    enabled: !!videoId, // Only run the query if videoId is available
    staleTime: 5 * 60 * 1000,
    
  });
};

export const useGetVideosByIdsQuery = (
  videoIds: string[] | undefined, // Array of video IDs // Optional useQuery options, keeping it simple like useGetVideosByUserIdQuery
) => {
  // Ensure videoIds is an array, even if undefined or null initially
  const idsToFetch = Array.isArray(videoIds) ? videoIds : [];
    
  // Use useQuery to manage fetching and caching
  return useQuery<Video[], AxiosError<ApiErrorStructure>>({
    // Unique key for this query. Includes the array of IDs to ensure
    // react-query caches different sets of videos separately.
    // Using JSON.stringify ensures the array content is part of the key.
    // This is similar to how useGetVideosByUserIdQuery includes userId, page, limit
    queryKey: ['videosByIds', JSON.stringify(idsToFetch)],

    // The function that performs the data fetching
    queryFn: async () => {
      // If there are no IDs to fetch, return an empty array immediately
      // This is an extra safeguard, as 'enabled' should prevent the queryFn from running,
      // but it's good practice.
      if (idsToFetch.length === 0) {
        return [];
      }

      // Make a POST request to your backend endpoint that fetches videos by IDs.
      // Assumes an endpoint like '/videos/by-ids' that accepts an array of IDs in the body.
      // Adjust the endpoint and request method if your backend is different.
      // This is the core functionality difference from useGetVideosByUserIdQuery (GET vs POST, endpoint, params/body)
      const response = await api.post('/videos/videosbyId', { videoIds: idsToFetch });

      // Assuming your APIResponse structure has a 'data' field containing the array of videos
      // Adjust 'response.data.data' if your API response structure is different
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data; // Return the array of Video objects
      } else {
        // Handle cases where the API call was successful but the backend indicated an error
        // or the data structure is unexpected.
        throw new Error(response.data?.message || 'Failed to fetch videos by IDs: Unexpected response format');
      }
    },

    // Only run the query if the videoIds array is not empty and the enabled option is true (or not explicitly set to false)
    // This is similar to how useGetVideosByUserIdQuery is enabled based on userId
    enabled: idsToFetch.length > 0,

    // Configure caching/staleness as needed.
    // This is similar to the staleTime configuration in useGetVideosByUserIdQuery.
    staleTime: 5 * 60 * 1000, // Example: Data is stale after 5 minutes
  });
};


export const useGetVideosByUserIdQuery = (userId: string | undefined, page: number = 1, limit: number = 10) => {
    return useQuery<VideoListResponse, Error>({
        queryKey: ['userVideos', userId, page, limit], // Unique key for videos by user
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required to fetch videos.');
            }
            // Adjust the URL to your backend endpoint for fetching videos by user ID
            const response = await api.get(`/videos/user/${userId}`, {
                 params: { page, limit } // Pass pagination query params
            });
            return response.data.data;
        },
        enabled: !!userId, // Only run the query if userId is available
        staleTime: 5 * 60 * 1000, // Keep previous data while fetching next page
    });
}

// Custom hook to fetch comments for a video
export const useGetVideoCommentsQuery = (videoId: string) => {
    return useQuery<Comment[], Error>({
        queryKey: ['videoComments', videoId], // Key for comments of a specific video
        queryFn: async () => {
            // Adjust the URL to your backend endpoint for fetching comments for a video
            const response = await api.get(`/videos/${videoId}/comments`);
            return response.data.data;
        },
        enabled: !!videoId, // Only run if videoId is available
        staleTime: 60 * 1000, // Comments might update more frequently
    });
};


// --- User Interaction Queries ---

// Custom hook to fetch the logged-in user's liked video IDs
// This might be called once on user login to initialize the Zustand store
export const useGetUserLikedVideosQuery = () => {
    const { user, setLikedVideos } = useAuthStore(); // Get the authenticated user from your store
    const userId = user?._id; // Get the database user ID

    // The type parameter should reflect the expected data structure,
    // which is likely an array of IVideo
    return useQuery<string[], AxiosError<ApiErrorStructure>>({
        queryKey: ['userLikedVideos', userId], // Query key includes userId for caching per user
        queryFn: async () => {
            // Use the protected '/me/liked-videos' endpoint
            const response = await api.get('/videos/me/liked-videos');
            // Assuming the backend APIResponse data property contains the array of videos
            if(response.data.data){
              setLikedVideos(response.data.data)
            }
            return response.data.data;
        },
        // Only run the query if the user is authenticated (userId is available)
        enabled: !!userId,
        staleTime: Infinity,
        gcTime: Infinity
        // You might want to add refetchOnMount/Window/Reconnect settings based on your needs
    });
};

// Custom hook to fetch the logged-in user's subscribed channel IDs
// This might be called once on user login to initialize the Zustand store

interface SubscribedChannel {
    _id: string;
    username: string;
    fullname: string;
    avatarUrl: string;
    videoCount: number; // Added videoCount
}

export const useGetMySubscriptionsQuery = () => {
    const { user, setSubscribedChannels } = useAuthStore();
    const userId = user?._id;

    return useQuery<SubscribedChannel[], Error>({
        queryKey: ['mySubscriptions', userId],
        queryFn: async () => {
            const response = await api.get('/users/me/subscriptions');
            if(response.data.data){
              setSubscribedChannels(response.data.data)
              
            }
            return response.data.data;
        },
        enabled: !!userId,
        staleTime: Infinity,
        gcTime:Infinity
    });
};

interface Subscriber {
    _id: string;
    username: string;
    fullname: string;
    avatarUrl: string;
}

export const useGetChannelSubscribersQuery = (channelId: string) => {
  const { setSubscribedByChannels} = useAuthStore()
    return useQuery<Subscriber[], Error>({
        queryKey: ['channelSubscribers', channelId],
        queryFn: async () => {
            const response = await api.get(`/users/${channelId}/subscribers`);
            if(response.data.data){
              
              setSubscribedByChannels(response.data.data)
            }
            return response.data.data
        },
        enabled: !!channelId,
        staleTime: Infinity,
        gcTime:Infinity
    });
};

interface UserProfileData {
    user: {
        _id: string;
        username: string;
        fullname: string;
        avatarUrl: string;
    };
    latestVideos: {
        _id: string;
        title: string;
        thumbnailUrl: string;
        duration: number;
        createdAt: string;
        views: number;
        ownerDetails: IUser;
    }[];
}

export const useGetUserProfileQuery = (userId: string) => {
    return useQuery<UserProfileData, Error>({
        queryKey: ['userProfile', userId],
        queryFn: async () => {
            const response = await api.get(`/users/profile/${userId}`);
            return response.data.data;
        },
        enabled: !!userId,
        staleTime: Infinity,
        gcTime: Infinity
    });
};

// --- Playlist Queries ---

// Custom hook to fetch the logged-in user's playlists
export const useGetUserPlaylistsQuery = () => {
    const { user, setPlaylists } = useAuthStore(); // Get the authenticated user from your store
    const userId = user?._id; // Get the database user ID (for query key)
    

    // The type parameter is the expected success data payload, and the error type
    return useQuery<Playlist[], AxiosError<ApiErrorStructure>>({ // Corrected error type
        queryKey: ['userPlaylists', userId], // Cache key includes user ID
        queryFn: async () => {
            // Call the protected '/users/me/playlists' endpoint
            // Assuming your user router is mounted at '/api/v1/users'
            const response = await api.get('/users/me/playlists');
            // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
            // Assuming the backend APIResponse data property contains the array of IPlaylist objects
            const playlists = response.data.data; // Correctly extract data from APIResponse
            
            if(response.data.data){
                setPlaylists(playlists)
            }

            return playlists
        },
        // Only enable this query if the user is authenticated (userId is available)
        enabled: !!userId,
        // Configure caching/staleness as needed
        staleTime: Infinity, // Playlists might not change as frequently as videos
        gcTime: Infinity
    });
};

// Custom hook to fetch a single playlist by ID
export const useGetPlaylistByIdQuery = (playlistId: string) => {
    return useQuery<Playlist, Error>({
        queryKey: ['playlist', playlistId], // Unique key for a single playlist
        queryFn: async () => {
            // Adjust the URL to your backend endpoint for fetching a single playlist
            const response = await api.get(`/playlists/${playlistId}`);
            return response.data.data;
            
        },
        enabled: !!playlistId, // Only run if playlistId is available
        staleTime: Infinity,
    });
}


export const useGetUserWatchLaterQuery = () => {
  const { user, setWatchLater } = useAuthStore();

  return useQuery<string[], Error>({
    queryKey: ['watchLater', user?._id],
    queryFn: async () => {
      const response = await api.get('/users/later/');
      if (response.data && response.data.data) {
        setWatchLater(response.data.data); // Expecting an array of IVideo
        return response.data.data;
      }
    },
    enabled: !!user?._id,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};


export const useGetUserWatchHistoryQuery = () => {
  const { user, setHistory }= useAuthStore()
  return useQuery<WatchHistoryResponse, Error>({
    queryKey: ['watchHistory', user?._id],
    queryFn: async () => {
      const response = await api.get('/users/history');
      const data = response.data.data
      if(data){
        setHistory(data)
      }
      return response.data.data;
    },

    enabled: !!user?._id,
    gcTime: Infinity,
    staleTime: Infinity
    
  });
};