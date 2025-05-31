import { useGetUserWatchHistoryQuery } from '@/store/api/queries';
import VideoCard from '../components/VideoCard'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom'; 
import { formatDuration, timeSince } from '@/utils/utils'; 
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { useRemoveFromWatchHistoryMutation } from '@/store/api/mutations';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';

function WatchHistoryPage() {
  const { isLoading, isError, error, isSuccess, refetch } = useGetUserWatchHistoryQuery();
  const navigate = useNavigate(); 
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const removeVideoMutation = useRemoveFromWatchHistoryMutation()

  const { watchHistory } = useAuthStore()

  useEffect(() => {
    // Refetch data after a 5-second delay
    const timer = setTimeout(() => {
      refetch();
    }, 500);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [refetch]);

  const handleRemoveVideoClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVideoToDelete(videoId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVideo = () => {
    if (videoToDelete) {
      // Trigger delete playlist mutation
      removeVideoMutation.mutate({videoId: videoToDelete });
      setIsDeleteDialogOpen(false);
      refetch();
    }
  };

  const skeletonCount = 8; 

  // Handle click on a video card
  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (isError) {
    return (
      <div className="container mx-auto mt-8 text-red-600 dark:text-red-400">
        Error loading watch history: {error?.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Watch History</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3 w-full min-h-[16rem] max-w-[400px] md:w-full my-8 sm:my-4">
              <Skeleton className="h-[208px] w-full rounded-xl dark:bg-gray-700" />
              <div className="space-y-2 h-[95.2px] flex flex-col pb-8">
                <Skeleton className="flex-1 dark:bg-gray-700" />
                <Skeleton className="flex-1 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : isSuccess && watchHistory && watchHistory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {watchHistory.map((entry) => (
            <VideoCard
              key={entry._id} 
              id={entry.video._id} 
              className="min-h-[16rem] w-[300px] md:w-full my-3 sm:my-4" 
              title={entry.video.title}
              thumbnail={entry.video.thumbnailUrl || ''} 
              description={''} 
              channelAvatar={entry.video.ownerDetails?.avatarUrl || ''} 
              channelName={entry.video.ownerDetails?.fullname || entry.video.ownerDetails?.username || 'Unknown Channel'} 
              views={entry.video.views}
              postedOn={timeSince(entry.video.createdAt) + " ago"} 
              duration={formatDuration(entry.video.duration)} 
              onClickFunction={() => handleVideoClick(entry.video._id)} 
              actionButton = {
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => handleRemoveVideoClick(entry.video._id, e)} 
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
        <div className="text-center text-slate-500 mt-8">Your watch history is empty.</div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Delete Video</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this video? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={confirmDeleteVideo}
                disabled={removeVideoMutation.isPending}
              >
                {removeVideoMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

export default WatchHistoryPage;