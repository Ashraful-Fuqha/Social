import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDuration, timeSince } from "@/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserProfileQuery } from '@/store/api/queries';
import VideoCard from '@/components/VideoCard'; 

function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate()
    const { data: profileData, isLoading, isError, error } = useGetUserProfileQuery(userId || '');

    const handleVideoClick = (videoId: string) => {
        navigate(`/video/${videoId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto mt-8">
                <div className="flex items-center space-x-4 mb-6">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold mb-4">Latest Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="aspect-video rounded-md overflow-hidden shadow-sm">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <div className="container mx-auto mt-8 text-red-500">Error loading profile: {error?.message}</div>;
    }

    const { user, latestVideos } = profileData!;

    return (
        <div className="container mx-auto mt-8">
            <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatarUrl} alt={user.fullname} />
                    <AvatarFallback>{user.fullname?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-semibold">{user.fullname}</h2>
                    <p className="text-gray-500">@{user.username}</p>
                </div>
            </div>
            <h2 className="text-xl font-semibold mb-4">Latest Videos</h2>
            {latestVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {latestVideos.map((video) => (
                        <VideoCard
                            key={video._id}
                            id={video._id}
                            title={video.title}
                            thumbnail={video.thumbnailUrl}
                            duration={formatDuration(video.duration)}
                            views={video.views} 
                            channelName={user.fullname || user.username}
                            channelAvatar={user.avatarUrl || ""}
                            postedOn={timeSince(video.createdAt)}
                            onClickFunction={() => {handleVideoClick(video._id)}}
                            className=''
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No videos uploaded yet.</p>
            )}
        </div>
    );
}

export default UserProfilePage;