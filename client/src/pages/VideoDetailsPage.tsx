// src/pages/VideoDetailPage.tsx
import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom'; // Assuming you use react-router-dom for routing
import { useGetChannelSubscribersQuery, useGetVideoByIdQuery, useGetVideoCommentsQuery } from '../store/api/queries'; // Import query hooks
import { useAuthStore } from '../store/authStore'; // Import Zustand store
import { Skeleton } from "@/components/ui/skeleton"; // Shadcn Skeleton
// Ensure Avatar is imported correctly from shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adjusted import path if needed
import { timeSince } from "../utils/utils"; // Utility functions
import LikeButton from '../components/LikeButton'; // We'll create this component
import SubscribeButton from '../components/SubscribeButton'; // We'll create this component
import CommentsSection from '../components/CommentsSection'; // We'll create this component
import AddToPlaylistModal from '../components/AddToPlaylistModal'; // We'll create this component
import { Share2Icon, SaveAll, GripIcon, EllipsisVertical, Eye } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button"; // Shadcn Button
// Ensure DropdownMenu components are imported correctly from shadcn/ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"; 
import VideoPlayer from '@/components/VideoPlayer';
import { toast } from 'sonner';
import { useAddToWatchHistoryMutation } from '@/store/api/mutations';
import debounce from 'lodash/debounce';

function VideoDetailPage() {
  // Get the video ID from the URL parameters
  const { videoId } = useParams<{ videoId: string }>();
  const { addToHistory } = useAuthStore()

  // Fetch video details using the custom hook
  const { data: video, isLoading: isVideoLoading, isError: isVideoError, error: videoError } = useGetVideoByIdQuery(videoId || '');

  // Fetch comments for the video
  const { data: comments, isLoading: isCommentsLoading, isError: isCommentsError, error: commentsError, refetch: Crefetch } = useGetVideoCommentsQuery(videoId || '');
  
  const { refetch: Srefetch } = useGetChannelSubscribersQuery(video?.ownerDetails?._id || '')
  // Get user's liked videos and subscribed channels from Zustand store
  const { user, likedVideos, subscribedByChannels, subscribedChannels, dislikedVideos } = useAuthStore();
  
  const { mutate: mutateToHistory } = useAddToWatchHistoryMutation({
    onSuccess: (data) => {
      addToHistory(data)
    },
    onError: (error) => {
      console.error('Error updating watch history:', error);
    },
  });

  const debouncedAddToHistory = debounce((videoId: string) => {
    mutateToHistory({ videoId });
  }, 500);

  useEffect(() => {
    if (videoId) {
      debouncedAddToHistory( videoId );
    }
  }, [])
  // State for managing the AddToPlaylistModal
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = React.useState(false);

  const shareableUrl = `${window.location.origin}/video/${videoId}`;
  const handleShare = () => {
    navigator.clipboard.writeText(shareableUrl)
        .then(() => {
            toast('Video URL',{
              description: "URL Copied to clipboard!"
            }); 
        })
        .catch(err => {
            console.error('Failed to copy URL: ', err);
            toast('Video URL',{
              description: "Failed to copy URL. Please try again."
            });
        });
  };

  // --- Conditional Rendering (Loading, Error) ---

  if (isVideoLoading) {
    return (
      <div className="container mx-auto mt-8 flex flex-col md:flex-row gap-8 md:gap-[5rem]">
        {/* Left Column Skeleton */}
        <div className='flex flex-col md:w-2/3'>
          <Skeleton className="h-[400px] w-full mb-4" />
          <Skeleton className="h-10 w-3/4 mb-4" /> 
          <div className="flex items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full mr-4" />
            <div className="flex-1">
              <Skeleton className="h-6 w-1/4 mb-2" /> 
              <Skeleton className="h-6 w-1/6" /> 
            </div>
            <Skeleton className="h-10 w-20 ml-auto" /> 
          </div>
           <Skeleton className="h-20 w-full mb-4 md:hidden" />
        </div>
         {/* Right Column Skeleton (only visible on md and up, or acts as comments placeholder) */}
        <div className='md:w-1/3'>
           <Skeleton className="h-20 w-full mb-4 hidden md:block" />
           <Skeleton className="h-8 w-1/2 mb-4" /> 
           <Skeleton className="h-12 w-full mb-2" />
           <Skeleton className="h-12 w-full mb-2" />
        </div>
      </div>
    );
  }

  if (isVideoError) {
    return (
      <div className="container mx-auto mt-8 text-red-600 dark:text-red-400">
        Error loading video: {videoError?.message}
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto mt-8 text-center">
        Video not found.
      </div>
    );
  }

  // --- Render Video Details and Interactions ---

  const hasLiked = likedVideos.includes(videoId ?? "");
  const hasDisliked = dislikedVideos.includes(videoId ?? "")
  const isSubscribed = subscribedChannels.includes(video.ownerDetails._id);


  return (
    <div className="container mx-auto mt-8 flex flex-col md:flex-row gap-8 md:gap-[5rem]">
      {/* --- Left Column (Video Player, Title, Actions, Channel Info) --- */}
      <div className='flex flex-col md:w-2/3'>

        {/* Video Player */}
        <div className="aspect-video bg-gray-800 flex items-center justify-center text-white text-2xl mb-4 rounded-md overflow-hidden">
          <VideoPlayer videoUrl={video.videoUrl} thumbnailUrl={video.thumbnailUrl} />
        </div>

        {/* Video Title and Actions */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex-1 mr-2 overflow-hidden whitespace-nowrap text-ellipsis min-w-0">{video.title}</h1>
          <div className="flex items-center gap-[0.5rem]">
            <LikeButton videoId={videoId ?? ""} initialIsLiked={hasLiked} initialIsDisliked = {hasDisliked} />

            <Button variant="ghost" className="flex items-center gap-2" onClick={handleShare}>
              <Share2Icon size={18} /> Share
            </Button>

            <DropdownMenu>
              {/* Added asChild to allow Button to be the trigger */}
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className="w-56 z-10 relative bg-[rgb(70,70,70)] p-5 mr-8 mt-1 text-white rounded-md">
                <DropdownMenuGroup>
                  {/* Consider making these interactive (e.g., show description in a modal/section) */}
                  <DropdownMenuItem className="flex gap-3 mb-3 cursor-pointer" onSelect={(e) => e.preventDefault()}> 
                    <GripIcon size={18} /> Description 
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-3 mb-3 cursor-pointer" onSelect={(e) => e.preventDefault()} onClick={() => setIsAddToPlaylistModalOpen(true)}>
                    <SaveAll size={18} /> Save to Playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-3 cursor-pointer" onSelect={(e) => e.preventDefault()} onClick={() => { /* Handle Save to Watch Later */ }}>
                    <Eye size={18} /> Save to Watch Later
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${video.ownerDetails._id}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.ownerDetails?.avatarUrl} alt={video.ownerDetails?.fullname} />
                <AvatarFallback>{video.ownerDetails?.fullname?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{video.ownerDetails?.fullname.slice(0,5)}</p> 
                
                <p className="text-sm text-slate-500">{subscribedByChannels.length}</p>
              </div>
            </Link>
          </div>
          {/* Subscribe/Unsubscribe Button */}
          {user?._id !== video.ownerDetails._id ? (
            <SubscribeButton channelId={video.ownerDetails._id} initialIsSubscribed={isSubscribed} refech={Srefetch} />
          ) : (
            <div></div>
          )}
        </div>

         {/* Video Description (Visible on small screens) */}
         <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6 md:hidden">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{video.views} views</span> • <span className="font-semibold">{timeSince(video.createdAt)} ago</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{video.description}</p>
            </div>
      </div>

      {/* --- Right Column (Description, Comments Section) --- */}
      {/* This div acts as the second flex item */}
      <div className='md:w-1/3'>

        {/* Video Description (Visible on md and up) */}
         <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6 hidden md:block">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{video.views} views</span> • <span className="font-semibold">{timeSince(video.createdAt)} ago</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{video.description}</p>
            </div>


        {/* Comments Section */}
        <CommentsSection videoId={video._id} comments={comments} isLoading={isCommentsLoading} isError={isCommentsError} error={commentsError} refetch={Crefetch} />

      </div> {/* End of Right Column */}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        videoId={video._id}
        isOpen={isAddToPlaylistModalOpen}
        onClose={() => setIsAddToPlaylistModalOpen(false)}
      />
    </div>
  );
}

export default VideoDetailPage;