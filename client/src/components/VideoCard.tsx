import { Avatar } from "./ui/avatar"
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { EllipsisVertical, Share2Icon, Eye, SaveAll, GripIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@radix-ui/react-dropdown-menu"
import {
  Card,
  CardContent,
  CardFooter,
} from "./ui/card"
import { AspectRatio } from "./ui/aspect-ratio"
import React from "react"
import AddToPlaylistModal from "./AddToPlaylistModal"
import { toast } from "sonner"
import { useAddToWatchLaterMutation } from "@/store/api/mutations"

interface VideoCardProps {
  id: string
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  channelName: string;
  channelAvatar: string;
  postedOn: string;
  description?: string;
  onClickFunction: () => void;
  className: string;
  actionButton? : React.ReactNode
}

function VideoCard({
  title,
  id,
  thumbnail,
  duration,
  views,
  channelName,
  channelAvatar,
  postedOn,
  onClickFunction,
  className,
  actionButton
}: VideoCardProps) {

  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = React.useState(false);
  const handleOpenAddToPlaylistModal = (event: React.MouseEvent) => {
    event.stopPropagation(); // Stop the click event from bubbling up to the Card
    setIsAddToPlaylistModalOpen(true);
  };

  const addToWatchLater = useAddToWatchLaterMutation()

  const handleWatchLater = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if(id){
      addToWatchLater.mutate({videoId: id})
    }
  }

  const shareableUrl = `${window.location.origin}/video/${id}`;
  const handleShare = () => {
    navigator.clipboard.writeText(shareableUrl)
        .then(() => {
            toast('Video URL',{
              description: "URL Copied to clipboard!"
            }); // Or use a toast notification
        })
        .catch(err => {
            console.error('Failed to copy URL: ', err);
            toast('Video URL',{
              description: "Failed to copy URL. Please try again."
            });
        });
  };
  return (
    // Added subtle hover effect to the whole card for better interaction feedback
    <Card className={`border-none rounded-[0.8rem] p-0 overflow-hidden ${className} 
    dark:bg-gray-800 dark:text-gray-200 
    transition-colors duration-200 
    hover:bg-gray-50 dark:hover:bg-gray-700`} // Added hover effect for the card
    onClick={onClickFunction}>
    <CardContent className="p-0">
      <div className="w-full p-0 relative">
      <AspectRatio ratio={16 / 11}>
      <img src={thumbnail} alt="" className="w-full h-full cursor-pointer object-cover" />
      </AspectRatio>
      <span className="absolute bg-black/60 text-xs px-1 rounded-sm font-semibold bottom-[0.5rem] right-2 text-white py-0.5">{duration}</span>
      </div>
      <div className="flex justify-between items-center mt-3 mb-1 px-4">
      <h3 className="text-base leading-[1.2rem] mr-0 overflow-ellipsis line-clamp-2 font-semibold text-gray-700 dark:text-white">
        {title}
      </h3>
      <DropdownMenu>
        <DropdownMenuTrigger>
        {/* Made ellipsis icon pure white in dark mode for better visibility */}
        <span className="cursor-pointer active:scale-75 flex-shrink-0 text-gray-700 dark:text-white">
          <EllipsisVertical size={18} />
        </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 z-10 bg-[rgb(70,70,70)] p-2 text-white rounded-md dark:bg-gray-700 dark:text-gray-50">
        
        <DropdownMenuSeparator className="my-2 bg-gray-600 dark:bg-gray-500"/>
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded-sm dark:hover:bg-gray-600">
          <GripIcon size={18}/>Description
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded-sm dark:hover:bg-gray-600" onClick={(e) => handleOpenAddToPlaylistModal(e)}>
          <SaveAll size={18}/>Save to Playlist
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded-sm dark:hover:bg-gray-600" onSelect={(e) => e.stopPropagation()} onClick={(e) => handleWatchLater(id, e)}>
          <Eye size={18}/>Save to Watch Later
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded-sm dark:hover:bg-gray-600" onSelect={(e) => e.stopPropagation()} onClick={handleShare}>
          <Share2Icon size={18}/>Share
          </DropdownMenuItem>
        </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </CardContent>

    <CardFooter className="flex items-start justify-between px-4 mb-4">
      <div className="flex gap-3.5 items-start flex-grow">
      <Avatar className="size-12 p-0 m-0">
        <AvatarImage src={channelAvatar} alt={channelName} />
        <AvatarFallback>{channelName}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
        {/* Made channel name slightly brighter in dark mode */}
        <p className="text-xl text-slate-500 dark:text-gray-300">{channelName}</p>
        </div>
        {/* Made views and posted on text slightly brighter in dark mode */}
        <p className="text-[12px] text-slate-500 dark:text-gray-300"><span>{views} views </span><span className="before:content-['•'] before:pr-2">{postedOn}</span></p>
      </div>
      </div>
      {actionButton && (
      <div className="flex-shrink-0">
        {actionButton}
      </div>
      )}
    </CardFooter>
    <AddToPlaylistModal
      videoId={id}
      isOpen={isAddToPlaylistModalOpen}
      onClose={() => setIsAddToPlaylistModalOpen(false)}
    />
    </Card>
  )
}

export default VideoCard;