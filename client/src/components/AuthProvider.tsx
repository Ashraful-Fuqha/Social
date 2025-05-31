import { useAuthInterceptor } from "@/utils/useAuthInterceptor";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This hook will set up the authentication token for API requests
  useAuthInterceptor();
  
  return <>{children}</>;
};