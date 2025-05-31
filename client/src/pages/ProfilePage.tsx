import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGetVideosByUserIdQuery } from '@/store/api/queries'; 
import VideoCard from "@/components/VideoCard"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { formatDuration, timeSince } from "../utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


function ProfilePage() {
    const navigate = useNavigate();

    const { user, likedVideos, subscribedChannels } = useAuthStore();
    const backendUserId = user?._id; 
    
    // --- State for Pagination ---
    const [page, setPage] = useState(1);
    const limit = 8; 

    // --- Fetch User's Videos ---
    const {
        data: userVideosData,
        isLoading: isUserVideosLoading,
        isError: isUserVideosError,
        error: userVideosError,
        isFetching 
    } = useGetVideosByUserIdQuery(backendUserId, page, limit);

    const isUserDataLoading = !user && backendUserId === undefined;

    // --- Conditional Rendering ---

    if (isUserDataLoading) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen p-4">
                  <h2 className="text-xl font-semibold mb-4">Loading Profile...</h2>
                  <Skeleton className="w-32 h-32 rounded-full mb-4" />
                  <Skeleton className="w-48 h-6 mb-2" />
                  <Skeleton className="w-64 h-5" /> 
             </div>
         );
    }

    // Handle the case where user data is not found after loading
    // This might happen if the user is authenticated via Clerk but no backend user was created/linked
    if (!user) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">User Profile Not Found</h2>
                  <p>It seems your backend profile hasn't been created yet.</p>
             </div>
         );
    }


    // Show error state for fetching user's videos
    if (isUserVideosError) {
        console.error("Error fetching user videos:", userVideosError);
        return (
            <div className="container mx-auto p-4 mt-8">
                 <h1 className="text-2xl font-bold mb-4">My Profile</h1>
                 <Card className="mb-8">
                     <CardHeader>
                         <CardTitle>User Information</CardTitle>
                     </CardHeader>
                     <CardContent className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={user.avatarUrl} alt={user.fullname || user.username} />
                            <AvatarFallback>{user.fullname?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-semibold">{user.fullname || user.username}</p>
                            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                     </CardContent>
                 </Card>
                 <h2 className="text-xl font-semibold mb-4">My Videos</h2>
                 <div className="text-red-600 dark:text-red-400">
                     Error loading videos: {userVideosError.message}
                 </div>
            </div>
        );
    }

    const actualVideoCount = userVideosData?.docs?.length ?? 0; 

    const videoSkeletonCount = actualVideoCount > 0 ? actualVideoCount : limit;

    return (
        <div className="container mx-auto p-4 mt-8">
            {/* --- User Information Section --- */}
            <h1 className="text-2xl font-bold mb-4">My Profile</h1>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 max-sm:hidden">
                        <AvatarImage src={user.avatarUrl} alt={user.fullname || user.username} />
                        <AvatarFallback>{user.fullname?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xl font-semibold">{user.fullname}</p>
                        <p className="text-base font-medium italic">@{user.username}</p>
                        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        {/* Add more user details here if needed */}
                        <Link to={"/subscriptions"}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Subscribed Channels: {subscribedChannels.length}</p>
                        </Link>
                        <Link to={'/likedvideos'}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Liked Videos: {likedVideos.length}</p>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* --- User Videos Section --- */}
            <h2 className="text-xl font-semibold mb-4">My Uploaded Videos</h2>

            {isUserVideosLoading && !isFetching ? ( 
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: videoSkeletonCount }).map((_, index) => (
                        <div key={`video-skeleton-${index}`} className="flex flex-col space-y-3">
                            <Skeleton className="h-[150px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                 </div>
            ) : userVideosData?.docs.length === 0 ? ( 
                <div className="text-center text-gray-500 dark:text-gray-400">
                    You haven't uploaded any videos yet.
                </div>
            ) : ( // Render videos
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userVideosData?.docs.map((video) => (
                        <VideoCard
                            key={video._id}
                            id={video._id}
                            className=''
                            title={video.title}
                            thumbnail={video.thumbnailUrl}
                            description={video.description}
                            channelAvatar={video.ownerDetails?.avatarUrl}
                            channelName={video.ownerDetails?.fullname}
                            views={video.views}
                            postedOn={timeSince(video.createdAt) + " ago"}
                            duration={formatDuration(video.duration)}
                            onClickFunction={() => navigate(`/video/${video._id}`)} 
                         />
                    ))}
                 </div>
            )}

            {/* --- Pagination Controls --- */}
            {(userVideosData?.totalPages ?? 0) > 1 && (
                 <div className="flex justify-center mt-8 space-x-4">
                     <Button
                         onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                         disabled={page === 1 || isFetching}
                         variant="outline"
                     >
                         Previous Page
                     </Button>
                      <span className="self-center text-gray-700 dark:text-gray-300">
                         Page {page} of {userVideosData?.totalPages}
                      </span>
                     <Button
                         onClick={() => setPage(prev => prev + 1)}
                         disabled={page === (userVideosData?.totalPages ?? page) || isFetching}
                         variant="outline"
                     >
                         Next Page
                     </Button>
                 </div>
            )}
             {isFetching && <div className="text-center mt-4">Loading more videos...</div>} 
        </div>
    );
}

export default ProfilePage;