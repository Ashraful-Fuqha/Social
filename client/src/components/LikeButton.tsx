// Alternative Solution - Updated LikeButton.tsx
import { useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../store/authStore';
import { useLikeVideoMutation, useDislikeVideoMutation } from '../store/api/mutations';
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  videoId: string;
  initialIsLiked: boolean;
  initialIsDisliked: boolean;
}

function LikeButton({ videoId, initialIsLiked, initialIsDisliked }: LikeButtonProps) {
  const {
    likedVideos,
    dislikedVideos,
    addLikedVideos,
    removeLikedVideo,
    addDislikedVideos,
    removeDislikedVideo,
  } = useAuthStore();

  // Sync initial state with Zustand store on component mount
  useEffect(() => {
    // Sync liked status
    if (initialIsLiked && !likedVideos.includes(videoId)) {
      addLikedVideos(videoId);
    } else if (!initialIsLiked && likedVideos.includes(videoId)) {
      removeLikedVideo(videoId);
    }

    // Sync disliked status
    if (initialIsDisliked && !dislikedVideos.includes(videoId)) {
      addDislikedVideos(videoId);
    } else if (!initialIsDisliked && dislikedVideos.includes(videoId)) {
      removeDislikedVideo(videoId);
    }
  }, []); // Only run on mount

  // Use only Zustand state for UI display
  const isLiked = likedVideos.includes(videoId);
  const isDisliked = dislikedVideos.includes(videoId);

  const likeMutation = useLikeVideoMutation();
  const dislikeMutation = useDislikeVideoMutation();

  const handleLikeClick = () => {
    if (isLiked) {
      // Unlike the video
      likeMutation.mutate({ videoId, action: 'unlike' });
    } else {
      // Like the video (optimistically remove dislike if present)
      if (isDisliked) {
        removeDislikedVideo(videoId);
      }
      likeMutation.mutate({ videoId, action: 'like' });
    }
  };

  const handleDislikeClick = () => {
    if (isDisliked) {
      // Undislike the video
      dislikeMutation.mutate({ videoId, action: 'undislike' });
    } else {
      // Dislike the video (optimistically remove like if present)
      if (isLiked) {
        removeLikedVideo(videoId);
      }
      dislikeMutation.mutate({ videoId, action: 'dislike' });
    }
  };

  const likeMutating = likeMutation.isPending;
  const dislikeMutating = dislikeMutation.isPending;

  return (
    <div className="flex items-center space-x-2">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLikeClick}
        disabled={likeMutating}
        className={cn(
          "flex items-center gap-1",
          isLiked ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
        )}
      >
        {likeMutating ? (
          <span className="animate-spin">🔄</span>
        ) : isLiked ? (
          <ThumbsUp size={18} fill="currentColor" />
        ) : (
          <ThumbsUp size={18} />
        )}
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDislikeClick}
        disabled={dislikeMutating}
        className={cn(
          "flex items-center gap-1",
          isDisliked ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}
      >
        {dislikeMutating ? (
          <span className="animate-spin">🔄</span>
        ) : isDisliked ? (
          <ThumbsDown size={18} fill="currentColor" />
        ) : (
          <ThumbsDown size={18} />
        )}
      </Button>
    </div>
  );
}

export default LikeButton;  