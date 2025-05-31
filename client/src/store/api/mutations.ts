/* eslint-disable @typescript-eslint/no-unused-vars */
// src/api/mutations.ts
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import api from './axios'; // Import the configured Axios instance
import { useAuthStore } from '../authStore'; // Import the Zustand auth store
import { AxiosError } from 'axios'; // Import AxiosError for better error typing
import { toast } from 'sonner';

// --- Frontend Interfaces for Data Payloads (Expected in APIResponse.data) ---

// Define the structure of a User object as returned in success payloads
export interface IUser {
    _id: string; // Mongoose ObjectId as a string
    clerkId: string; // Store Clerk's user ID
    username: string;
    email: string;
    fullname: string;
    avatarUrl: string;
    subscribedChannels: string[]; // Array of channel (user) IDs
    subscribedByChannels: string[];
    likedVideos: string[]; // Array of video IDs
    createdAt: string; // Dates often returned as strings
    updatedAt: string; // Dates often returned as strings
    // Add other user fields from your schema as strings/numbers/booleans
}

interface IVideo {
    _id: string
    title: string;
  description?: string;
  videoUrl: string; // URL of the video in cloud storage
  videoFilePublicId: string
  thumbnailUrl?: string; // URL of the video thumbnail
  thumbnailPublicId: string | null;
  owner: IUser; // Reference to the User who uploaded the video
  views: number;
//   likes: mongoose.Types.ObjectId[]; // Array of User IDs who liked the video
//   dislikes: mongoose.Types.ObjectId[]; // Array of User IDs who disliked the video
  createdAt: Date;
  updatedAt: Date;
  duration: number;
}

// Define the structure of a Comment as expected in the APIResponse.data payload
interface IComment {
    _id: string;
    content: string;
    video: string; // Video ID
    owner: string | IUser; // User ID string or populated IUser object
    createdAt: string;
    updatedAt: string;
    // Add other comment fields from your schema
}

// Define the structure of a Playlist as expected in the APIResponse.data payload
// You might already have this defined elsewhere, ensure consistency with your backend schema
interface IPlaylist {
    _id: string;
    name: string;
    owner: string | IUser; // User ID string or populated IUser object
    videoIds: string[]; // Array of video IDs as strings
    createdAt: string; // Dates often returned as strings
    updatedAt: string; // Dates often returned as strings
    // Add other playlist fields from your schema
}

// Define the structure of the error response body from your global error handler
// This is the structure you get in error.response.data
export interface ApiErrorStructure {
    statusCode: number;
    data: null; // Data is null on error responses
    message: string; // Main error message from ApiError
    errors: unknown[]; // Array of detailed errors from ApiError
    success: false; // Always false for error responses
    stack?: string; // Stack trace (usually only in development)
}

interface UploadVideoSuccessPayload {
    video: IVideo; // Assuming backend returns the created video object
    message?: string; // Backend APIResponse also has message, but can include in payload too
}

export const useUploadVideoMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<UploadVideoSuccessPayload, AxiosError<ApiErrorStructure>, FormData>({
        mutationFn: async (formData) => {
            const response = await api.post('/videos/upload', formData);
            // --- Return the 'data' property from the backend's APIResponse ---
            
            return response.data.data; // Returning UploadVideoSuccessPayload
        },
        onSuccess: () => { 
            // Invalidate the video list query to show the new video
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
        onError: (error) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error("Video upload failed:", error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || 'Video upload failed';
            // TODO: Display errorMessage to the user in the UI
            // You can also access detailed errors: error.response?.data?.errors
            console.error("Upload errors:", error.response?.data?.errors);
        },
    });
};


// --- Video Interaction Mutations ---

// Custom hook for liking a video
interface VideoActionPayload {
  videoId: string;
}

interface VideoActionResponse {
  message: string;
  liked?: boolean;
  disliked?: boolean;
  likesCount?: number;
  dislikesCount?: number;
}

// --- useLikeVideoMutation ---
export const useLikeVideoMutation = (
  options?: UseMutationOptions<VideoActionResponse, AxiosError<ApiErrorStructure>, VideoActionPayload & { action: 'like' | 'unlike' }>
) => {
  const queryClient = useQueryClient();
  const { addLikedVideos, removeLikedVideo, removeDislikedVideo } = useAuthStore();

  return useMutation<VideoActionResponse, AxiosError<ApiErrorStructure>, VideoActionPayload & { action: 'like' | 'unlike' }>({
    mutationFn: async ({ videoId, action }) => {
      const response = await api.post(`/videos/${videoId}/likes`, { action });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      
      if (variables.action === 'like') {
        addLikedVideos(variables.videoId);
        removeDislikedVideo(variables.videoId);
      } else {
        removeLikedVideo(variables.videoId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['video', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['likedVideosDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dislikedVideosDetails'] });
      
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: (error, variables) => {
      console.error(`Failed to ${variables.action} video ${variables.videoId}:`, error.response?.data || error.message);
      options?.onError?.(error, variables, undefined);
    },
    ...options,
  });
};

export const useDislikeVideoMutation = (
  options?: UseMutationOptions<VideoActionResponse, AxiosError<ApiErrorStructure>, VideoActionPayload & { action: 'dislike' | 'undislike' }>
) => {
  const queryClient = useQueryClient();
  const { addDislikedVideos, removeLikedVideo, removeDislikedVideo } = useAuthStore();

  return useMutation<VideoActionResponse, AxiosError<ApiErrorStructure>, VideoActionPayload & { action: 'dislike' | 'undislike' }>({
    mutationFn: async ({ videoId, action }) => {
      const response = await api.post(`/videos/${videoId}/dislikes`, { action });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      
      if (variables.action === 'dislike') {
        addDislikedVideos(variables.videoId);
        removeLikedVideo(variables.videoId);
      } else {
        removeDislikedVideo(variables.videoId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['video', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['likedVideosDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dislikedVideosDetails'] });
      
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: (error, variables) => {
      console.error(`Failed to ${variables.action} video ${variables.videoId}:`, error.response?.data || error.message);
      options?.onError?.(error, variables, undefined);
    },
    ...options,
  });
};

// Custom hook for adding a comment to a video
interface AddCommentPayload {
    videoId: string;
    content: string;
}
export const useAddCommentMutation = (
    // options?: UseMutationOptions<
    //     IComment, // Expected successful response data type
    //     AxiosError<ApiErrorStructure> // Variables type
    // >
) => {
    const queryClient = useQueryClient();

    // Mutation returns IComment payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<IComment, AxiosError<ApiErrorStructure>, AddCommentPayload>({ // Mutation returns the new comment in data payload
        mutationFn: async ({ videoId, content }) => {
            // Adjust the URL to your backend endpoint for adding a comment
             // Assuming this endpoint returns a success APIResponse with data: IComment
            const response = await api.post(`/videos/${videoId}/comments`, { content });
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
            return response.data.data; // Returning IComment as per mutation type
        },
        onSuccess: (newComment, { videoId }) => { // 'newComment' here is the IComment object
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] }); // Refetch comments list
             queryClient.invalidateQueries({ queryKey: ['video', videoId] }); // Refetch video details (if it includes comment count)
             // Optionally update the comments list directly in the cache for perceived instant update
             queryClient.setQueryData(['videoComments', videoId], (oldData: IComment[] | undefined) => {
                 // Add the new comment to the existing list, assuming backend returns the full comment object
                 return oldData ? [...oldData, newComment] : [newComment];
             });
        },
        onError: (error, { videoId }) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to add comment to video ${videoId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to add comment to video ${videoId}`;
            // Handle error display in UI using errorMessage
        }
    });
};

interface UpdateCommentPayload {
    commentId: string;
    content: string;
}

export const useUpdateCommentMutation = (
    options?: UseMutationOptions<
        IComment, // Expected successful response data type (the updated comment)
        AxiosError<ApiErrorStructure>, // Error type
        UpdateCommentPayload // Variables type (commentId and content)
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<IComment, AxiosError<ApiErrorStructure>, UpdateCommentPayload>({
        mutationFn: async ({ commentId, content }) => {
            // Adjust the URL to your backend endpoint for updating a comment
            const response = await api.patch(`/videos/comments/${commentId}`, { content });
            return response.data.data; // Assuming your backend returns the updated comment in the 'data' property of an APIResponse
        },
        onSuccess: (updatedComment) => {
            // Invalidate relevant queries
            // We need to invalidate the specific comment and potentially the list of comments for the video
            queryClient.invalidateQueries({ queryKey: ['comment', updatedComment._id] });
            queryClient.invalidateQueries({ queryKey: ['videoComments', updatedComment.video] }); // Assuming 'video' field in IComment holds the video ID

            // Optionally update the comment in the cache for a perceived instant update
            queryClient.setQueryData(['comment', updatedComment._id], updatedComment);
            queryClient.setQueryData(['videoComments', updatedComment.video], (oldData: IComment[] | undefined) => {
                if (oldData) {
                    return oldData.map(comment =>
                        comment._id === updatedComment._id ? updatedComment : comment
                    );
                }
                return [updatedComment]; // If for some reason the list wasn't fetched before
            });
        },
        onError: (error, { commentId }) => {
            console.error(`Failed to update comment ${commentId}:`, error.response?.data || error.message);
            // const errorMessage = error.response?.data?.message || error.message || `Failed to update comment ${commentId}`;
            // Handle error display in UI using errorMessage
        },
        ...options, // Spread any provided options to the useMutation hook
    });
};

interface DeleteCommentPayload {
    commentId: string;
}

// Define the success response type (can be void or an object with deleted ID)
interface DeleteCommentSuccessResponse {
    deletedCommentId: string;
}

export const useDeleteCommentMutation = (
    options?: UseMutationOptions<
        DeleteCommentSuccessResponse, // Expected successful response data type
        AxiosError<ApiErrorStructure>, // Error type
        DeleteCommentPayload // Variables type (only commentId)
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<DeleteCommentSuccessResponse, AxiosError<ApiErrorStructure>, DeleteCommentPayload>({
        mutationFn: async ({ commentId }) => {
            // Adjust the URL to your backend endpoint for deleting a comment
            const response = await api.delete(`/videos/comments/${commentId}`);
            return response.data.data; // Assuming your backend returns a success APIResponse with data: { deletedCommentId: string }
        },
        onSuccess: (data, { commentId }) => {
            // Invalidate relevant queries
            // Invalidate the specific comment and the list of comments for the video
            queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
            // We might not have direct access to the video ID here, so we might need to invalidate
            // the entire video comments list to ensure it's refetched without the deleted comment.
            // Alternatively, if your backend returns the videoId in the success response, you can use it.
            // Assuming your backend returns { deletedCommentId: string, videoId: string } in the data:
            // queryClient.invalidateQueries({ queryKey: ['videoComments', data.videoId] });
            // If not, a more general invalidation might be necessary:
            queryClient.invalidateQueries({ queryKey: ['videoComments'] }); // Invalidate all video comments lists
            // If video details include comment count, you might want to refetch that too
            // queryClient.invalidateQueries({ queryKey: ['video'] }); // Or a more specific video query

            // Optionally update the cache to remove the deleted comment for a perceived instant update
            queryClient.setQueryData(['videoComments'], (oldData: IComment) => {
                if (Array.isArray(oldData)) {
                    return oldData.filter((comment: IComment) => comment._id !== commentId);
                }
                return undefined;
            });
        },
        onError: (error, { commentId }) => {
            console.error(`Failed to delete comment ${commentId}:`, error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || `Failed to delete comment ${commentId}`;
            // Handle error display in UI using errorMessage
        },
        ...options, // Spread any provided options
    });
};

// Custom hook for subscribing to a channel
export const useSubscribeToChannelMutation = () => {
    const queryClient = useQueryClient();
    // Assuming authStore methods addSubscription and removeSubscription manage an array of channel IDs
    const { addSubscription } = useAuthStore();

     // Mutation returns void payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<void, AxiosError<ApiErrorStructure>, string>({ // Mutation takes channelId as a string
        mutationFn: async (channelId) => {
            // Adjust the URL to your backend endpoint for subscribing
             // Assuming this endpoint returns a success APIResponse with data: null
            const response = await api.post(`/users/${channelId}/subscribe`);
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
            return response.data.data; // Returning void as per mutation type, though it might be null
        },
        onSuccess: (_, channelId) => { // 'data' here is the data payload (likely void/null)
            // Update Zustand store
            addSubscription(channelId); // Assuming this adds channelId to a subscribedChannels array in store
             // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }); // Refetch the user's subscriptions list
            queryClient.invalidateQueries({ queryKey: ['channel', channelId] }); // If you have a channel details query
            queryClient.invalidateQueries({ queryKey: ['channelSubscribers', channelId] })
        },
        onError: (error, channelId) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to subscribe to channel ${channelId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to subscribe to channel ${channelId}`;
             // Handle error display in UI using errorMessage
             // Optionally revert the Zustand state if the backend call failed
            // removeSubscription(channelId);
        }
    });
};

// Custom hook for unsubscribing from a channel
export const useUnsubscribeFromChannelMutation = () => {
    const queryClient = useQueryClient();
     const { removeSubscription } = useAuthStore(); // Get actions

     // Mutation returns void payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<void, AxiosError<ApiErrorStructure>, string>({ // Mutation takes channelId as a string
        mutationFn: async (channelId) => {
            // Adjust the URL to your backend endpoint for unsubscribing
             // Assuming this endpoint returns a success APIResponse with data: null
            const response = await api.post(`/users/${channelId}/unsubscribe`); // Or maybe a DELETE request
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
             return response.data.data; // Returning void as per mutation type, though it might be null
        },
        onSuccess: (_, channelId) => { // 'data' here is the data payload (likely void/null)
            // Update Zustand store
            removeSubscription(channelId); // Assuming this removes channelId from a subscribedChannels array in store
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }); // Refetch the user's subscriptions list
            queryClient.invalidateQueries({ queryKey: ['channel', channelId] }); // If you have a channel details query
            queryClient.invalidateQueries({ queryKey: ['channelSubscribers', channelId] })
        },
        onError: (error, channelId) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to unsubscribe from channel ${channelId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to unsubscribe from channel ${channelId}`;
             // Handle error display in UI using errorMessage
             // Optionally revert the Zustand state if the backend call failed
            // addSubscription(channelId);
        }
    });
};





// --- Playlist Mutations ---

// Custom hook for creating a playlist
interface CreatePlaylistPayload {
    name: string;
    // Add other fields needed for creating a playlist
}
export const useCreatePlaylistMutation = () => {
    const queryClient = useQueryClient();
    // Assuming authStore addPlaylist action updates the user's playlist list
    const { addPlaylist } = useAuthStore();

     // Mutation returns IPlaylist payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<IPlaylist, AxiosError<ApiErrorStructure>, CreatePlaylistPayload>({ // Mutation returns the new playlist in data payload
        mutationFn: async (playlistData) => {
            // Adjust the URL to your backend endpoint for creating a playlist
             // Assuming this endpoint returns a success APIResponse with data: IPlaylist
            const response = await api.post('/playlists/create', playlistData);
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
            return response.data.data; // Returning IPlaylist as per mutation type
        },
        onSuccess: (newPlaylist) => { // 'newPlaylist' here is the IPlaylist object
            // Update Zustand store
            addPlaylist(newPlaylist); // Assuming this adds the playlist object to a list in the store
             // Invalidate relevant queries
            toast(`Playlist`, {
                description: "Playlist Created Successfully",
            });
            queryClient.invalidateQueries({ queryKey: ['userPlaylists'] }); // Refetch user's playlists list
        },
        onError: (error) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error("Failed to create playlist:", error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || 'Failed to create playlist';
             // Handle error display in UI using errorMessage
             toast(`Playlist`, {
                description: "Error Creating Playlist",
            })
        }
    });
};

// Custom hook for updating a playlist
interface UpdatePlaylistPayload {
    playlistId: string;
    name: string;
}
export const useUpdatePlaylistMutation = (
    options?: UseMutationOptions<
        IPlaylist, // Expected successful response data type
        AxiosError<ApiErrorStructure>, // Error type
        UpdatePlaylistPayload // Variables type
    >
) => {
     const queryClient = useQueryClient();
     // Assuming authStore updatePlaylist action updates a playlist object in the store
     const { updatePlaylist } = useAuthStore();

     // Mutation returns IPlaylist payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<IPlaylist, AxiosError<ApiErrorStructure>, UpdatePlaylistPayload>({ // Mutation returns the updated playlist in data payload
        mutationFn: async ({ playlistId, name }) => {
            // Adjust the URL to your backend endpoint for updating a playlist
             // Assuming this endpoint returns a success APIResponse with data: IPlaylist
            const response = await api.patch(`/playlists/update/${playlistId}`, {name}); // Using PATCH for partial updates
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
             return response.data.data; // Returning IPlaylist as per mutation type
        },
        onSuccess: (updatedPlaylist) => { // 'updatedPlaylist' here is the IPlaylist object
            // Update Zustand store
            updatePlaylist(updatedPlaylist); // Assuming this updates the playlist object in a list in the store
             // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['playlist', updatedPlaylist._id] }); // Refetch specific playlist
             queryClient.invalidateQueries({ queryKey: ['userPlaylists'] }); // Optionally refetch user's playlists list
        },
        onError: (error, { playlistId }) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to update playlist ${playlistId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to update playlist ${playlistId}`;
             // Handle error display in UI using errorMessage
        },
        ...options 
    });
};

// Custom hook for deleting a playlist
export const useDeletePlaylistMutation = () => {
    const queryClient = useQueryClient();
    // Assuming authStore removePlaylist action removes a playlist by ID from the store
    const { removePlaylist } = useAuthStore();

     // Mutation returns void payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<void, AxiosError<ApiErrorStructure>, string>({ // Mutation takes playlistId as a string
        mutationFn: async (playlistId) => {
            // Adjust the URL to your backend endpoint for deleting a playlist
             // Assuming this endpoint returns a success APIResponse with data: null
            const response = await api.delete(`/playlists/delete/${playlistId}`);
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
             return response.data.data; // Returning void as per mutation type, though it might be null
        },
        onSuccess: (_, playlistId) => { // 'data' here is the data payload (likely void/null)
            // Update Zustand store
            removePlaylist(playlistId); // Assuming this removes the playlist by ID from the store
             // Invalidate relevant queries
             toast("Playlist Deleted" ,{
                description: "The playlist has been deleted.",
            });
             queryClient.invalidateQueries({ queryKey: ['userPlaylists'] }); // Refetch user's playlists list
        },
        onError: (error, playlistId) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to delete playlist ${playlistId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to delete playlist ${playlistId}`;
             // Handle error display in UI using errorMessage
        }
    });
};

// Custom hook for adding a video to a playlist
interface AddVideoToPlaylistPayload {
    playlistId: string;
    videoId: string;
}
export const useAddVideoToPlaylistMutation = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore()
    const userId = user?._id
    // Assuming authStore addVideoToPlaylist action updates a playlist in the store
    const { addVideoToPlaylist } = useAuthStore();

     // Mutation returns IPlaylist payload on success
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<IPlaylist, AxiosError<ApiErrorStructure>, AddVideoToPlaylistPayload>({ // Mutation returns the updated playlist in data payload
        mutationFn: async ({ playlistId, videoId }) => {
            // Adjust the URL to your backend endpoint for adding a video to a playlist
             // Assuming this endpoint returns a success APIResponse with data: IPlaylist (the updated playlist)
            const response = await api.post(`/playlists/${playlistId}/videos`, { videoId });
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
             return response.data.data; // Returning IPlaylist as per mutation type
        },
        onSuccess: (updatedPlaylist, { playlistId, videoId }) => {
            // Update Zustand store
            addVideoToPlaylist(playlistId, videoId); // Assuming this updates the playlist object in the store
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }); // Refetch the specific playlist
             queryClient.invalidateQueries({ queryKey: ['userPlaylists', userId] }); // Optionally refetch user's playlists list
             // Optionally update the playlist in cache directly
             queryClient.setQueryData(['playlist', playlistId], () => {
                 // Replace the old playlist data with the newly returned updated playlist
                 return updatedPlaylist;
             });
             toast(`Playlist`, {
                description: "Video Added to Playlist Successfully",
            });
        },
        onError: (error, { playlistId, videoId }) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to add video ${videoId} to playlist ${playlistId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to add video ${videoId} to playlist ${playlistId}`;
             // Handle error display in UI using errorMessage
             toast(`Playlist`, {
                description: "Error Add to Playlist",
            })
        }
    });
};

// Custom hook for removing a video from a playlist
interface RemoveVideoFromPlaylistPayload {
    playlistId: string;
    videoId: string;
}
export const useRemoveVideoFromPlaylistMutation = (
    options?: UseMutationOptions<
        IPlaylist, // Expected successful response data type
        AxiosError<ApiErrorStructure>, // Error type
        RemoveVideoFromPlaylistPayload // Variables type
    >
) => {
    const queryClient = useQueryClient();
    // Assuming authStore removeVideoFromPlaylist action updates a playlist in the store
    const { removeVideoFromPlaylist, user } = useAuthStore();
    const userId = user?._id
     // Mutation returns IPlaylist payload on success (assuming backend returns updated playlist)
    // Error type is AxiosError containing ApiErrorStructure in response.data
    return useMutation<IPlaylist, AxiosError<ApiErrorStructure>, RemoveVideoFromPlaylistPayload>({ // Mutation returns the updated playlist in data payload
        mutationFn: async ({ playlistId, videoId }) => {
            // Adjust the URL to your backend endpoint for removing a video from a playlist
            // This might be a DELETE request to a specific video endpoint within the playlist
             // Assuming this endpoint returns a success APIResponse with data: IPlaylist (the updated playlist)
             const response = await api.post(`/playlists/${playlistId}/videos/${videoId}`);
             // --- CORE CHANGE: Return the 'data' property from the backend's APIResponse ---
             return response.data.data; // Returning IPlaylist as per mutation type
        },
        onSuccess: (updatedPlaylist, { playlistId, videoId }) => { 
            // Update Zustand store
            removeVideoFromPlaylist(playlistId, videoId); // Assuming this updates the playlist object in the store
             // Invalidate relevant queries
             queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }); // Refetch the specific playlist
             queryClient.invalidateQueries({ queryKey: ['userPlaylists', userId] }); // Optionally refetch user's playlists list
             // Optionally update the playlist in cache directly
             queryClient.setQueryData(['playlist', playlistId], () => {
                 // Replace the old playlist data with the newly returned updated playlist
                 return updatedPlaylist;
             });
        },
        onError: (error, { playlistId, videoId }) => {
             // 'error.response?.data' is the ApiErrorStructure
            console.error(`Failed to remove video ${videoId} from playlist ${playlistId}:`, error.response?.data || error.message);
             // --- Use the backend's error message if available ---
            // const errorMessage = error.response?.data?.message || error.message || `Failed to remove video ${videoId} from playlist ${playlistId}`;
             // Handle error display in UI using errorMessage
        },
        ...options
    });
};

interface AddToWatchLaterPayload {
  videoId: string;
}

export const useAddToWatchLaterMutation = () => {
  const queryClient = useQueryClient();
  const { user, addToWatchLaterStore } = useAuthStore();
  const userId = user?._id;

  return useMutation<string, ApiErrorStructure, AddToWatchLaterPayload>({
    mutationFn: async ({ videoId }) => {
      const response = await api.post(`/users/later/${videoId}`); // Use params
      return response.data;
    },
    onSuccess: (_, { videoId }) => {
      addToWatchLaterStore(videoId);
      toast('Watch Later', {
        description: 'Video added from watch later successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['watchLater', userId] });
      
    },
    onError: (error, {videoId}) => {
      console.error(`Failed to add video ${videoId} to watch history:`, error.data || error.message);
      const errorMessage = error?.message || error.message || `Failed to add video to watch later`;
      toast.error('Watch History', {
        description: errorMessage,
      });
    },
  });
};

interface RemoveFromWatchHistoryPayload {
  videoId: string;
}

export const useRemoveFromWatchLaterMutation = () => {
  const queryClient = useQueryClient();
  const { removeFromWatchLaterStore } = useAuthStore();

  return useMutation<string, ApiErrorStructure, RemoveFromWatchHistoryPayload>({
    mutationFn: async ({ videoId }) => {
      const response = await api.delete(`/users/later/${videoId}`);
      return response.data; // Adjust based on your backend response structure
    },
    onSuccess: (_, { videoId }) => {
      // Update Zustand store
      removeFromWatchLaterStore(videoId);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['watchLater'] });
      toast('Watch Later', {
        description: 'Video removed from watch later successfully',
      });
    },
    onError: (error, { videoId }) => {
      console.error(`Failed to remove video ${videoId} from watch later:`, error);
      toast.error('Watch Later', {
        description: `Error removing video: ${error.message || 'Something went wrong'}`,
      });
    },
  });
};

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

interface AddToWatchHistoryPayload {
  videoId: string;
}


export const useAddToWatchHistoryMutation = (
  options?: UseMutationOptions<
    WatchHistoryResponse, // Adjust based on your expected success response data
    AxiosError<ApiErrorStructure>,
    AddToWatchHistoryPayload
  >
) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?._id;

  return useMutation<WatchHistoryResponse, AxiosError<ApiErrorStructure>, AddToWatchHistoryPayload>({
    mutationFn: async ({videoId}) => {
      const response = await api.post(`/users/history/${videoId}`);
      return response.data.data; // Assuming your API returns the created/updated history entry in data
    },
    onSuccess: () => {
      // Invalidate the watch history query to refetch
      
      queryClient.invalidateQueries({ queryKey: ['watchHistory', userId] });
    },
    onError: (error, { videoId }) => {
      console.error(`Failed to add video ${videoId} to watch history:`, error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || `Failed to add video to watch history`;
      toast.error('Watch History', {
        description: errorMessage,
      });
    },
    ...options,
  });
};

interface RemoveFromWatchHistoryPayload {
  videoId: string;
}

export const useRemoveFromWatchHistoryMutation = () => {
  const queryClient = useQueryClient();
  const { removeFromHistory } = useAuthStore();

  return useMutation<string, ApiErrorStructure, RemoveFromWatchHistoryPayload>({
    mutationFn: async ({ videoId }) => {
      const response = await api.delete(`/users/history/${videoId}`);
      return response.data; // Adjust based on your backend response structure
    },
    onSuccess: (_, { videoId }) => {
      // Update Zustand store
      removeFromHistory(videoId);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
      toast('Watch History', {
        description: 'Video removed from watch history successfully',
      });
    },
    onError: (error, { videoId }) => {
      console.error(`Failed to remove video ${videoId} from watch history:`, error);
      toast.error('Watch History', {
        description: `Error removing video: ${error.message || 'Something went wrong'}`,
      });
    },
  });
};