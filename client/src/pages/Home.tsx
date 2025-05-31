import { useGetAllVideosQuery, useGetCurrentUserQuery } from '../store/api/queries';
import VideoCard from "@/components/VideoCard";
import { formatDuration, timeSince } from "../utils/utils";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

function Home() {
 // You can pass a query string here if your API supports searching/filtering
 const { data: allVideosData, isLoading: isAllVideosLoading, isError: isAllVideosError, error: allVideosError } = useGetAllVideosQuery();

  // --- Fetching User-Specific Data ---
  // Get the current authenticated user from Clerk
  const { setLoggedIn } = useAuthStore()
  const { data: backendUser, isSuccess: isBackendUserSuccess} = useGetCurrentUserQuery();
  const { isSignedIn } = useAuth()

   // --- Effects to Sync Clerk/Backend State with Zustand Store ---

  useEffect(() => {

  if(isBackendUserSuccess){
   setLoggedIn(backendUser)
  }
  },[backendUser, isBackendUserSuccess, setLoggedIn])

 const navigate = useNavigate();
 
 const skeletonCount = allVideosData?.totalDocs || 8; 

 // Handle click on a video card
 const handleVideoClick = (videoId: string) => {
  navigate(`/video/${videoId}`);
 };

 // --- Conditional Rendering ---

 // Show a message if there's an error fetching videos
 if (isAllVideosError) {
  return (
   <div className="absolute w-72 top-[40%] left-[50%] -translate-x-2/4 -translate-y-2/4 text-center text-red-600 dark:text-red-400">
    Error: {allVideosError.message}
   </div>
  );
 }

 // Show a message if there are no videos and not loading
 if (!isAllVideosLoading && (!allVideosData || allVideosData.docs.length === 0)) {
  // Example of conditional rendering based on auth state (uncomment if using Clerk)
  if (!isSignedIn) {
   return (
    <div className="absolute w-72 top-[40%] left-[50%] -translate-x-2/4 -translate-y-2/4 text-center">
     <h2 className="text-xl tracking-wider mb-2 text-teal-600 dark:text-teal-400 font-semibold">Please Login to access videos <Link to={'/login'} className="text-purple-600 font-semibold dark:text-purple-400">Login</Link> Or <Link to={'/signup'} className="text-purple-600 font-semibold dark:text-purple-400">Signup</Link></h2>
    </div>
   );
  } else {
   return (
    <div className="absolute w-64 top-[40%] left-[50%] -translate-x-2/4 -translate-y-2/4 text-center">
     <h2 className="text-xl tracking-wider mb-2 text-teal-600 dark:text-teal-400 font-semibold">No Videos Found</h2>
     <p className="tracking-wide text-gray-700 dark:text-gray-300">Check back later or upload one!</p>
    </div>
   );
  }
 }

 return (
  // Using flex-wrap to handle wrapping on smaller screens before md breakpoint
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
   {/* Show skeletons while loading */}
   {isAllVideosLoading ? (
    Array.from({ length: skeletonCount }).map((_, index) => (
     <div key={index} className="flex flex-col space-y-3 w-full min-h-[16rem] max-w-[400px] md:w-full my-8 sm:my-4">
      <Skeleton className="h-[208px] w-full rounded-xl dark:bg-gray-700" />
      <div className="space-y-2 h-[95.2px] flex flex-col pb-8">
       <Skeleton className="flex-1 dark:bg-gray-700" />
       <Skeleton className="flex-1 dark:bg-gray-700" />
      </div>
     </div>
    ))
   ) : (
    /* Render video cards once data is loaded */
    allVideosData?.docs?.map((video) => (
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
     />
    ))
   )}
  </div>
 );
}

export default Home;