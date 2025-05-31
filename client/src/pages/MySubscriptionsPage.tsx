import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMySubscriptionsQuery } from '@/store/api/queries';


function MySubscriptionsPage() {
    const { data: subscriptions, isLoading, isError, error } = useGetMySubscriptionsQuery();

    if (isLoading) {
        return (
            <div className="container mx-auto mt-8">
                <h2 className="text-2xl font-semibold mb-4">My Subscriptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index}>
                            <CardContent className="flex flex-col space-y-3">
                                <Skeleton className="h-32 w-full rounded-md" />
                                <Skeleton className="h-6 w-3/4" />
                                <div className="flex items-center space-x-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex flex-col">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-1/4 mt-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return <div className="container mx-auto mt-8 text-red-500">Error loading subscriptions: {error?.message}</div>;
    }
    
    return (
        <div className="container mx-auto mt-8">
            <h2 className="text-2xl font-semibold mb-4">My Subscriptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions?.map((channel) => (
                    <Card key={channel._id} className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="flex flex-col space-y-4">
                            <div className="flex items-center space-x-4">
                                <Link to={`/profile/${channel._id}`} className="flex-shrink-0">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={channel.avatarUrl} alt={channel.fullname} />
                                        <AvatarFallback>{channel.fullname?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div>
                                    <Link to={`/profile/${channel._id}`} className="font-semibold hover:underline">
                                        {channel.fullname}
                                    </Link>
                                    <p className="text-sm text-gray-500">@{channel.username}</p>
                                    <p className="text-sm text-gray-500">{channel.videoCount} videos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default MySubscriptionsPage;