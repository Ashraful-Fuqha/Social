import React, { useState } from 'react';
import { useAuthStore, type Playlist } from '../store/authStore'; 
import { useGetUserPlaylistsQuery } from '../store/api/queries';
import { useCreatePlaylistMutation, useDeletePlaylistMutation, useUpdatePlaylistMutation } from '../store/api/mutations';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2Icon, PlusCircleIcon, PencilIcon } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'

function PlaylistsPage() {

  const { playlists } = useAuthStore();


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);

  const [editedPlaylistName, setEditedPlaylistName] = useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  const { isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError, refetch} = useGetUserPlaylistsQuery();

  const createPlaylistMutation = useCreatePlaylistMutation();
  const updatePlaylistMutation = useUpdatePlaylistMutation({
      onSuccess: () => {
          // Show success toast (using Shadcn toast)
          toast("Playlist Updated" ,{
              description: "The playlist name has been updated.",
          });
          
          setIsEditDialogOpen(false); 
          setPlaylistToEdit(null);
          setEditedPlaylistName(''); 
          refetch()
      },
      onError: (error) => {
          toast("Error Updating Playlist",{
              description: error.response?.data?.message || error.message || "Failed to update playlist.",
          });
      }
  });

  const deletePlaylistMutation = useDeletePlaylistMutation();
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const handleCreatePlaylist = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPlaylistName.trim() && !createPlaylistMutation.isPending) {
      createPlaylistMutation.mutate({ name: newPlaylistName });
      setNewPlaylistName(''); 
      setShowNewPlaylistInput(false); 
      refetch()
    }

  };

   const handleEditPlaylistClick = (playlist: Playlist) => {
      setPlaylistToEdit(playlist); 
      setEditedPlaylistName(playlist.name);
      setIsEditDialogOpen(true); 
  };

  const confirmUpdatePlaylist = (event: React.FormEvent) => {
      event.preventDefault();
      if (playlistToEdit && editedPlaylistName.trim() && !updatePlaylistMutation.isPending) {
          // Trigger update playlist mutation
          updatePlaylistMutation.mutate({
              playlistId: playlistToEdit._id,
              name: editedPlaylistName.trim(), 
              
          });
      }
  };

  // Handle deleting a playlist
  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlaylist = () => {
    if (playlistToDelete) {
      // Trigger delete playlist mutation
      deletePlaylistMutation.mutate(playlistToDelete);
      setIsDeleteDialogOpen(false);
      refetch();
    }
  };

  // --- Conditional Rendering (Loading, Error) ---

  if (isPlaylistsLoading) {
    return (
      <div className="container mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => ( 
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isPlaylistsError) {
    return (
      <div className="container mx-auto mt-8 text-red-600 dark:text-red-400">
        Error loading playlists: {playlistsError?.message}
      </div>
    );
  }
  
  // --- Render Playlists ---

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Playlists</h1>

      {/* Create New Playlist Section */}
      {showNewPlaylistInput ? (
        <form onSubmit={handleCreatePlaylist} className="flex gap-2 mb-6 max-w-sm">
          <Input
            placeholder="New playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            disabled={createPlaylistMutation.isPending}
          />
          <Button type="submit" disabled={createPlaylistMutation.isPending || !newPlaylistName.trim()}>
            Create
          </Button>
          <Button variant="outline" onClick={() => setShowNewPlaylistInput(false)}>Cancel</Button>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowNewPlaylistInput(true)} className="mb-6">
          <PlusCircleIcon size={18} className="mr-2" /> Create New Playlist
        </Button>
      )}
       {createPlaylistMutation.isError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
            Error creating playlist: {createPlaylistMutation.error?.message}
        </p>
       )}


      {/* Playlists Grid */}
      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(playlist => (
            <Card key={playlist._id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                   <Link to={`/playlist/${playlist._id}`} className="hover:underline text-red-700">
                      {playlist.name}
                   </Link>
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPlaylistClick(playlist)} 
                    disabled={updatePlaylistMutation.isPending || deletePlaylistMutation.isPending || createPlaylistMutation.isPending}
                    aria-label={`Edit playlist ${playlist.name}`}
                >
                    <PencilIcon size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePlaylist(playlist._id)}
                  disabled={deletePlaylistMutation.isPending} 
                >
                  <Trash2Icon size={18} />
                </Button>

              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{playlist?.videoIds.length || 0} videos</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         !showNewPlaylistInput && ( 
            <div className="text-center text-slate-500">You haven't created any playlists yet.</div>
         )
      )}
       {deletePlaylistMutation.isError && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-4">
            Error deleting playlist: {deletePlaylistMutation.error?.message}
        </p>
       )}

       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Delete Playlist</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this playlist? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={confirmDeletePlaylist}
                disabled={deletePlaylistMutation.isPending}
              >
                {deletePlaylistMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Playlist</DialogTitle>
                    <DialogDescription>
                        Update the name of your playlist.
                    </DialogDescription>
                </DialogHeader>
                {/* Edit Form */}
                <form onSubmit={confirmUpdatePlaylist}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="playlistName" className="text-right">
                                Name
                            </label>
                            <Input
                                id="playlistName"
                                value={editedPlaylistName}
                                onChange={(e) => setEditedPlaylistName(e.target.value)}
                                className="col-span-3"
                                disabled={updatePlaylistMutation.isPending}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            type="submit" 
                            disabled={updatePlaylistMutation.isPending || !editedPlaylistName.trim()} 
                        >
                            {updatePlaylistMutation.isPending ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default PlaylistsPage;
