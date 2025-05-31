import { useState } from 'react'; 
import ReactPlayer from 'react-player';
import { PlayIcon } from 'lucide-react'; 

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
}

function VideoPlayer({ videoUrl, thumbnailUrl }: VideoPlayerProps) {
  // State to control whether the actual player is shown
  const [showPlayer, setShowPlayer] = useState(false);

  // Function to handle the click on the thumbnail/overlay
  const handlePlayClick = () => {
    setShowPlayer(true);
  };

  return (
    // Use a container div with relative positioning for the absolute overlay
    <div className="relative aspect-video bg-black rounded-md w-full h-full overflow-hidden">
      {showPlayer ? (
        // If showPlayer is true, render the actual ReactPlayer
        <ReactPlayer
          url={videoUrl}
          controls={true} // Show video controls
          playing={true} // *** Start playing automatically when the player is rendered ***
          width="100%"
          height="100%"
          // Add other event handlers as needed (e.g., onEnded, onPause)
        />
      ) : (
        // If showPlayer is false, render the thumbnail preview
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-cover bg-center"
          // Use background-image to display the thumbnail while maintaining aspect ratio with cover
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
          onClick={handlePlayClick} // Set state to show player on click
          aria-label="Play video" // Accessibility
          role="button" // Accessibility
        >
           {/* Optional: Add an overlay div for better contrast */}
           <div className="absolute inset-0 bg-black opacity-30"></div>

          {/* Add a visible Play button icon in the center */}
          <PlayIcon
            size={80} // Adjust size as needed
            className="text-white opacity-80 transition-opacity hover:opacity-100 z-10" // z-10 to ensure it's above the overlay
          />
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;