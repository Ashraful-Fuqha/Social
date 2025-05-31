import { Button } from "@/components/ui/button"; 
import { useAuthStore } from '../store/authStore'; 
import { useSubscribeToChannelMutation, useUnsubscribeFromChannelMutation } from '../store/api/mutations'; // Mutation hooks

interface SubscribeButtonProps {
  channelId: string;
  initialIsSubscribed: boolean; // Initial state based on data fetch
  refech: () => void;
}

function SubscribeButton({ channelId, refech }: SubscribeButtonProps) {
  // Get Zustand state and actions
  const { subscribedChannels, addSubscription, removeSubscription } = useAuthStore();
  // Determine current subscribed status based on Zustand store
  
  console.log(subscribedChannels.includes(channelId))
  console.log(subscribedChannels)
  
  const isSubscribed = subscribedChannels.includes(channelId);

  // Get mutation hooks
  const subscribeMutation = useSubscribeToChannelMutation();
  const unsubscribeMutation = useUnsubscribeFromChannelMutation();

  console.log(channelId);
  
  // Use the state from Zustand as the source of truth for UI
  const currentIsSubscribed = isSubscribed;

  const handleSubscribeClick = () => {
    if (currentIsSubscribed) {
      // If currently subscribed, call unsubscribe mutation
      unsubscribeMutation.mutate(channelId);
      // Optimistically update Zustand state
      removeSubscription(channelId);
      refech()
    } else {
      // If not subscribed, call subscribe mutation
      subscribeMutation.mutate(channelId);
      // Optimistically update Zustand state
      addSubscription(channelId);
    }
  };

  // Determine if either mutation is currently in progress
  const isMutating = subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <Button
      onClick={handleSubscribeClick}
      disabled={isMutating} // Disable button while mutation is in progress
      variant={"ghost"} // Change style based on status
      className='text-md text-red-600 dark:text-red-500 p-0'
    >
      {isMutating ? (
         <span className="animate-spin mr-2">🔄</span> // Simple spinner
      ) : null}
      {currentIsSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </Button>
  );
}

export default SubscribeButton;
