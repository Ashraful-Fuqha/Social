import { useClerk } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthToken } from '../store/api/axios';

/**
 * A hook that manages authentication tokens for API requests
 * Place this in a high-level component like App or a custom AuthProvider
 */
export function useAuthInterceptor() {
  const { session } = useClerk();
  
  useEffect(() => {
    // Function to get and set the token
    const setupAuthToken = async () => {
      try {
        if (session) {
          const token = await session.getToken();
          setAuthToken(token);
        } else {
          // Clear token when no session exists
          setAuthToken(null);
        }
      } catch (error) {
        console.error("Error setting auth token:", error);
        setAuthToken(null);
      }
    };
    
    // Set up token initially
    setupAuthToken();
    
    
    // Clean up function (when component unmounts)
    return () => {
      setAuthToken(null);
    };
  }, [session]);
  
  // No need to return anything unless you want to expose some functionality
}