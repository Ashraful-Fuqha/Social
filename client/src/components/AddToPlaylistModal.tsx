import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { useAuthStore } from '../store/authStore'; 
import { useGetUserPlaylistsQuery } from '../store/api/queries';
import { useCreatePlaylistMutation, useAddVideoToPlaylistMutation } from '../store/api/mutations'; 
import { Skeleton } from "@/components/ui/skeleton";

interface AddToPlaylistModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

function AddToPlaylistModal({ videoId, isOpen, onClose }: AddToPlaylistModalProps) {
  const { playlists } = useAuthStore();

  const { isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError, refetch } = useGetUserPlaylistsQuery();

  // Get mutation hooks
  const createPlaylistMutation = useCreatePlaylistMutation();
  const addVideoToPlaylistMutation = useAddVideoToPlaylistMutation();

  // State for creating a new playlist
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  // State for selected playlists
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);

  // Handle checkbox change
  const handlePlaylistSelect = (playlistId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPlaylists([...selectedPlaylists, playlistId]);
    } else {
      setSelectedPlaylists(selectedPlaylists.filter(id => id !== playlistId));
    }
  };

  // Handle creating a new playlist
  const handleCreatePlaylist = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPlaylistName.trim() && !createPlaylistMutation.isPending) {
      // Trigger create playlist mutation
      createPlaylistMutation.mutate({ name: newPlaylistName });
      setNewPlaylistName(''); // Clear input
      setShowNewPlaylistInput(false); // Hide input after creation attempt
      refetch()
    }
  };

  // Handle adding video to selected playlists
  const handleAddToSelectedPlaylists = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedPlaylists.length > 0 && !addVideoToPlaylistMutation.isPending) {
      // Trigger mutation for each selected playlist
      selectedPlaylists.forEach(playlistId => {
        addVideoToPlaylistMutation.mutate({ playlistId, videoId });
      });
      // Close modal after adding
      onClose();
      setSelectedPlaylists([]); // Clear selection

    }
  };

  // --- Conditional Rendering (Loading, Error for Playlists) ---

  if (isPlaylistsError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Loading Playlists</DialogTitle>
          </DialogHeader>
          <div className="text-red-600 dark:text-red-400">
            Error: {playlistsError?.message}
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isPlaylistsLoading ? (
            // Show skeletons while playlists are loading
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))
          ) : playlists && playlists.length > 0 ? (
            // List existing playlists
            playlists.map(playlist => (
              <div key={playlist._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`playlist-${playlist._id}`}
                  checked={selectedPlaylists.includes(playlist._id)}
                  onCheckedChange={(isChecked) => handlePlaylistSelect(playlist._id, isChecked === true)}
                  disabled={addVideoToPlaylistMutation.isPending}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label htmlFor={`playlist-${playlist._id}`}>
                  {playlist.name} ({playlist?.videoIds?.length || 0})
                </Label>
              </div>
            ))
          ) : (
            // Message if no playlists exist
            <div className="text-center text-slate-500">No playlists found.</div>
          )}

          {/* Create New Playlist Section */}
          {showNewPlaylistInput ? (
            <form onSubmit={handleCreatePlaylist} className="flex gap-2 mt-4">
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
            <Button variant="outline" onClick={() => setShowNewPlaylistInput(true)} className="mt-4">
              + Create new playlist
            </Button>
          )}
           {createPlaylistMutation.isError && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                Error creating playlist: {createPlaylistMutation.error?.message}
            </p>
           )}
        </div>
        <DialogFooter>
          <Button
            onClick={(e) => handleAddToSelectedPlaylists(e)}
            disabled={selectedPlaylists.length === 0 || addVideoToPlaylistMutation.isPending}
          >
            {addVideoToPlaylistMutation.isPending ? 'Adding...' : 'Add to Selected'}
          </Button>
           {addVideoToPlaylistMutation.isError && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                Error adding to playlist: {addVideoToPlaylistMutation.error?.message}
            </p>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddToPlaylistModal;
