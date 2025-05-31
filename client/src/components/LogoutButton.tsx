import { useClerk } from '@clerk/clerk-react'; 
import { useQueryClient } from '@tanstack/react-query'; 
import { useAuthStore } from '@/store/authStore'; 
import { Button } from '@/components/ui/button'; 

function LogoutButton() {
    const { signOut } = useClerk(); 
    const queryClient = useQueryClient();
    const { setLoggedOut } = useAuthStore();

    const handleLogout = async () => {
        try {
            // 1. Clean up application state in Zustand
            console.log('Logging out: Clearing Zustand state...');
            setLoggedOut();

            // 2. Clear React Query cache
            console.log('Logging out: Clearing React Query cache...');
            queryClient.clear(); // Clears all data from the cache

            // 3. Sign out from Clerk
            console.log('Logging out: Signing out from Clerk...');
            // signOut() ends the Clerk session and can redirect the user
            // By default, it often redirects to your Clerk "After Sign Out URL"
            await signOut();

            console.log('Logout complete.');

        } catch (error) {
            console.error('Error during logout:', error);
            // Handle any errors during the logout process (e.g., show a message)
            // The user might still be logged out of Clerk even if other steps fail
        }
    };

    return (
        <Button onClick={handleLogout} variant="destructive" className='ml-3 mt-3' size="sm">
            Logout
        </Button>
    );
}

export default LogoutButton;