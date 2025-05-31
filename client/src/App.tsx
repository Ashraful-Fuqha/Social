import { Protect, SignIn, SignUp } from "@clerk/clerk-react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import NavBar from "./components/Navbaar"
import Landing from "./pages/Landing"
import Home from "./pages/Home"
import PlaylistsPage from "./pages/PlaylistsPage"
import VideoDetailPage from "./pages/VideoDetailsPage"
import { Toaster } from "sonner"
import UploadVideoPage from "./pages/UploadVideoPage"
import PlaylistDetailPage from "./pages/PlaylistDetailPage"
import ProfilePage from "./pages/ProfilePage"
import LikedVideos from "./pages/LikedVideosPage"
import MySubscriptionsPage from "./pages/MySubscriptionsPage"
import UserProfilePage from "./pages/UserProfilePage"
import { useGetMySubscriptionsQuery, useGetUserLikedVideosQuery, useGetUserPlaylistsQuery, useGetUserWatchHistoryQuery, useGetUserWatchLaterQuery } from "./store/api/queries"
import { useEffect } from "react"
import WatchHistoryPage from "./pages/WatchHistoryPage"
import WatchLaterPage from "./pages/WatchLaterPage"

function App() {

  const { isSuccess: isLikedVideosSuccess } = useGetUserLikedVideosQuery();

  const { isSuccess: isSubscriptionsSuccess } = useGetMySubscriptionsQuery();
  
  const { isSuccess : isWatchLaterSuccess } = useGetUserWatchLaterQuery()

  const { isSuccess: isPlaylistsSuccess } = useGetUserPlaylistsQuery();

  const { isSuccess: isWatchHistorySuccess} = useGetUserWatchHistoryQuery()
  useEffect(() => {
    if (isLikedVideosSuccess) {
      console.log("Home Page: Successfully fetched and storing liked video IDs:");
    }
  }, [isLikedVideosSuccess]); 

  useEffect(() => {
    if (isSubscriptionsSuccess) {
      console.log("Home Page: Successfully fetched and storing subscribed channel IDs:");
    }
  }, [isSubscriptionsSuccess]); 

  useEffect(() => {
    if (isPlaylistsSuccess) {
      console.log("Home Page: Successfully fetched and storing playlists:");
    }
  }, [isPlaylistsSuccess])

  useEffect(() => {
    if (isWatchLaterSuccess) {
      console.log("Home Page: Successfully fetched and storing watch video IDs:");
    }
  }, [isWatchLaterSuccess]);

  useEffect(() => {
    if (isWatchHistorySuccess) {
      console.log("Home Page: Successfully fetched and storing watchHistory:");
    }
  }, [isWatchHistorySuccess]);

  return (
    <>
      <div className="mx-auto min-h-screen w-full font-mono">
        <BrowserRouter>
          <NavBar/>
          <main className="container px-8 mt-5">
            <Routes>
              <Route path="/" element={<Landing/>}/>
              <Route path="/signup" element={<div className="flex justify-center"><SignUp/></div>}/>
              <Route path="/signin" element={<div className="flex justify-center"><SignIn/></div>}/>
              <Route path="/home" element={<Protect fallback={<Landing/>}><Home/></Protect>}/>
              <Route path="/profile" element={<Protect fallback={<Landing/>}><ProfilePage/></Protect>}/>
              <Route path="/likedvideos" element={<Protect fallback={<Landing/>}><LikedVideos/></Protect>}/>
              <Route path="/video/:videoId" element={<VideoDetailPage />} />
              <Route path="/upload" element={<Protect fallback={<Landing/>}><UploadVideoPage /></Protect>} />
              <Route path="/subscriptions" element={<Protect fallback={<Landing/>}><MySubscriptionsPage /></Protect>} />
              <Route path="/profile/:userId" element={<Protect fallback={<Landing/>}><UserProfilePage /></Protect>} />
              <Route path="/history" element={<Protect fallback={<Landing/>}><WatchHistoryPage /></Protect>}/>
              <Route path="/watchlater" element={<Protect fallback={<Landing/>}><WatchLaterPage /></Protect>}/>
              <Route path="/playlists" element={<Protect fallback={<Landing/>}><PlaylistsPage /></Protect>} />
              <Route path="/playlist/:playlistId" element={<Protect fallback={<Landing/>}><PlaylistDetailPage/></Protect>} />
              <Route path='*' element={<Navigate to= "/"/>}/>
            </Routes>
          </main>
        </BrowserRouter>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  )
}

export default App
