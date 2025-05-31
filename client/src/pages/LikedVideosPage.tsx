import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/VideoCard';
import { useLikeVideoMutation } from '@/store/api/mutations';
import { useGetUserLikedVideosQuery, useGetVideosByIdsQuery } from '@/store/api/queries'
import { useAuthStore } from '@/store/authStore';
import { formatDuration, timeSince } from '@/utils/utils';
import { Trash2Icon } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LikedVideosPage() {
    const { likedVideos } = useAuthStore()
    const { isLoading, isError, error, refetch } = useGetUserLikedVideosQuery() 
    const {data: videos} = useGetVideosByIdsQuery(likedVideos)
    const navigate = useNavigate()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

    const handleVideoClick = (videoId: string) => {
      navigate(`/video/${videoId}`);
    };

    const removeVideoMutation = useLikeVideoMutation()

  const handleRemoveVideoClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVideoToDelete(videoId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVideo = () => {
    if (videoToDelete) {
      // Trigger delete playlist mutation
      removeVideoMutation.mutate({videoId: videoToDelete , action: "unlike" });
      setIsDeleteDialogOpen(false);
      refetch();
    }
  };

    if(isLoading){
        return (
      <div className="container mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => ( 
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
    }

    if(isError){
        return (
      <div className="container mx-auto mt-8 text-red-600 dark:text-red-400">
        Error loading videos: {error?.message}
      </div>
    );
    }

    
  return (
    <div>
      <h1 className='text-2xl font-bold mb-6 text-gray-800 dark:text-white'>Your Liked Videos</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos && videos.length > 0 ? (
          videos.map((video) => (
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
        )
        )) : (
          <div>
            <div className="text-center text-slate-500">There are no liked videos. Like some videos</div>
          </div>
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
    </div>
  )
}

export default LikedVideosPage