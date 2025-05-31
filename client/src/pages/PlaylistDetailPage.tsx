import { useNavigate, useParams } from 'react-router-dom'; // Hook to get URL parameters
import { Skeleton } from "@/components/ui/skeleton"; // Shadcn Skeleton
// import { useAuthStore } from '../store/authStore'; // Assuming you might need user info
import { useGetPlaylistByIdQuery } from '@/store/api/queries';
import { useRemoveVideoFromPlaylistMutation } from '@/store/api/mutations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useState } from 'react';
import { formatDuration, timeSince } from '@/utils/utils';
import VideoCard from '@/components/VideoCard';

function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoIdToDelete, setVideoIdToDelete] = useState<string | null>(null);

  const {
    data: playlist,
    isLoading: isPlaylistLoading,
    isError: isPlaylistError,
    error: playlistError,
    refetch
  } = useGetPlaylistByIdQuery(playlistId || ''); 

  // Get the mutation hook for removing a video
  const removeVideoMutation = useRemoveVideoFromPlaylistMutation({
    onSuccess: () => {
          toast("Video Removed", {
              description: "The video has been successfully removed from the playlist.",  
          });
          setIsDeleteDialogOpen(false);
          setVideoIdToDelete(null);
          refetch()
      },
      onError: (error) => {
          toast("Error", {
              description: error.response?.data?.message || error.message || "Failed to remove video from playlist.",
          });
          setIsDeleteDialogOpen(false);
          setVideoIdToDelete(null);
      }
  });

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleRemoveVideoClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoIdToDelete(videoId);
    setIsDeleteDialogOpen(true);
  };

  const confirmRemoveVideo = () => {
    if (!playlistId || !videoIdToDelete) {
      console.log(videoIdToDelete);
      
      console.error("Cannot remove video: Playlist ID or Video ID is missing.");
      toast("Client Error", {
          description: "Could not remove video due to missing information.",
      });
      return;
    }
    // Trigger the remove mutation with the stored playlist and video IDs
    removeVideoMutation.mutate({ playlistId, videoId: videoIdToDelete });
  };

  // --- Conditional Rendering (Loading, Error) ---

  if (isPlaylistLoading) {
    return (
      <div className="container mx-auto mt-8">
        <Skeleton className="h-10 w-1/2 mb-6" /> 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => ( 
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isPlaylistError) {
    return (
      <div className="container mx-auto mt-8 text-red-600 dark:text-red-400">
        Error loading playlist details: {playlistError?.message}
      </div>
    );
  }

  if (!playlist) {
      return (
          <div className="container mx-auto mt-8 text-center text-slate-500">
              Playlist not found.
          </div>
      );
  }

  // --- Render Playlist and Videos ---

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{playlist.name}</h1>
      {playlist.videoIds && playlist.videoIds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlist.videoIds.map(video => (
            <VideoCard
            key={video._id}
            id = {video._id}
            className="min-h-[16rem] w-[300px] md:w-full my-3 sm:my-4"
            title={video.title}
            thumbnail={video.thumbnailUrl} 
            description={video.description}
            channelAvatar={video.ownerDetails?.avatarUrl} 
            channelName={video.ownerDetails?.fullname} 
            views={video.views}
            postedOn={timeSince(video.createdAt) + " ago"}
            duration={formatDuration(video.duration)} 
            onClickFunction={() => handleVideoClick(video._id)} 
            actionButton = {
              <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => handleRemoveVideoClick(video._id, e)}
                  disabled={removeVideoMutation.isPending} 
                  className="flex-shrink-0 ml-2"
                  >
                  <Trash2Icon size={18} />
                </Button>
            }
          />
          ))}
        </div>
      ) : (
          <div className="text-center text-slate-500">This playlist is empty. Add some videos!</div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Removal</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this video from the playlist? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={confirmRemoveVideo}
                disabled={removeVideoMutation.isPending}
              >
                {removeVideoMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlaylistDetailPage;
