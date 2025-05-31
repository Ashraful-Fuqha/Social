import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"; 
import { useAuthStore } from "@/store/authStore";
import DarkModeToggle from "./DarkModeToggle";
import { useClerk } from "@clerk/clerk-react"; 

function SearchBar() {
  const { user } = useAuthStore();
  const { openUserProfile } = useClerk(); // Get the openUserProfile function from useClerk

  const handleAvatarClick = () => {
    // This will open the UserProfile component as a modal overlay
    openUserProfile();
  };

  return (
    <div className="">
      <div className="items-center max-w-screen-xl mx-auto">
        <div className="flex md:justify-normal justify-center items-center py-3">
          <h1 className="text-3xl md:text-4xl ml-2 uppercase md:mr-5 font-bold text-purple-600">Social.</h1>
          <form className="md:ml-auto ml-1 rounded-lg flex md:px-2 px-1 md:mr-5 mr-[.4rem] items-center space-x-2 border-b-2 border-b-purple-600">
            <Search className="h-6 w-6 text-purple-600" />
            <input
              className="w-full py-[.2rem] outline-none bg-transparent appearance-none  placeholder-gray-500 text-gray-500 sm:w-64 md:w-80"
              type="text"
              placeholder="Search"
            />
          </form>
          {/* Change from Link to a div with onClick */}
          <div
            onClick={handleAvatarClick}
            className="cursor-pointer" // Add cursor-pointer to indicate it's clickable
            title="Manage Profile" // Add a title for accessibility
          >
            <Avatar className="">
              <AvatarImage src={user?.avatarUrl ?? "https://github.com/shadcn.png"} className="object-fill" alt={user?.fullname || "User Avatar"} />
              <AvatarFallback>{user?.fullname?.charAt(0) || 'U'}</AvatarFallback> {/* Use charAt(0) for fallback */}
            </Avatar>
          </div>
          <div className="mx-2 object-fill">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;