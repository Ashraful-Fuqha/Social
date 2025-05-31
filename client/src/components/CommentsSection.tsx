import React, { useState } from 'react';
import { useAddCommentMutation, useUpdateCommentMutation, useDeleteCommentMutation } from '../store/api/mutations';
import type { Comment } from '../store/api/queries'; 
import { Button } from "@/components/ui/button"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"; 
import { timeSince } from "../utils/utils"; 
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { useAuthStore } from '../store/authStore'; 
import { toast } from 'sonner';

interface CommentsSectionProps {
  videoId: string;
  comments: Comment[] | undefined; // Array of comments
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void; // Function to refetch comments
}

function CommentsSection({ videoId, comments, isLoading, isError, error, refetch }: CommentsSectionProps) {
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedComment, setEditedComment] = useState('');
  const [commentToEditId, setCommentToEditId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Get the mutation hooks
  const addCommentMutation = useAddCommentMutation({
    onSuccess: () => {
      setNewCommentContent(''); // Clear input after successful post
      refetch(); // Refresh the comment list
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
    },
  });

  const updateCommentMutation = useUpdateCommentMutation({
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setCommentToEditId(null);
      setEditedComment('');
      refetch(); // Refresh the comment list
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
    },
  });

  const deleteCommentMutation = useDeleteCommentMutation({
    onSuccess: () => {
      refetch(); // Refresh the comment list
      toast('Comments', {
        description: "Comment deleted successfully"
      })
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
    },
  });

  const handleAddComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (newCommentContent.trim() && !addCommentMutation.isPending && user?._id) {
      // Trigger the add comment mutation
      addCommentMutation.mutate({ videoId, content: newCommentContent });
    }
  };

  const handleEditCommentClick = (comment: Comment) => {
    setCommentToEditId(comment._id);
    setEditedComment(comment.content);
    setIsEditDialogOpen(true);
  };

  const confirmUpdateComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (editedComment.trim() && commentToEditId && !updateCommentMutation.isPending) {
      updateCommentMutation.mutate({ commentId: commentToEditId, content: editedComment.trim() });
    }
  };

  const openDeleteConfirmation = (commentId: string) => {
    setCommentToDeleteId(commentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteComment = () => {
    if (commentToDeleteId && !deleteCommentMutation.isPending) {
      deleteCommentMutation.mutate({ commentId: commentToDeleteId });
      setIsDeleteDialogOpen(false);
      setCommentToDeleteId(null);
    }
  };

  // --- Conditional Rendering (Loading, Error for Comments) ---

  if (isError) {
    return (
      <div className="text-red-600 dark:text-red-400 mt-4">
        Error loading comments: {error?.message}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Comments ({comments?.length || 0})</h2>

      {/* Add New Comment Form */}
      {user?._id && (
        <form onSubmit={handleAddComment} className="mb-6 flex gap-4">
          {/* User Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullname} />
            <AvatarFallback>{user?.fullname?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              disabled={addCommentMutation.isPending || !user?._id}
              rows={2}
              className="mb-2"
            />
            <Button type="submit" disabled={addCommentMutation.isPending || !newCommentContent.trim() || !user?._id}>
              {addCommentMutation.isPending ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        // Show skeletons for comments while loading
        Array.from({ length: 3 }).map((_, index) => ( 
          <div key={index} className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        ))
      ) : comments && comments.length > 0 ? (
        comments.map(comment => (
          <div key={comment._id} className="flex gap-4 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.ownerDetails?.avatarUrl} alt={comment.ownerDetails?.fullname} />
              <AvatarFallback>{comment.ownerDetails?.fullname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {comment.ownerDetails?.fullname} <span className="text-xs text-slate-500 font-normal">{timeSince(comment.createdAt)} ago</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
              {user?._id === comment.ownerDetails._id && (
                <div className="flex items-center mt-2 space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditCommentClick(comment)} // Open edit dialog
                    disabled={updateCommentMutation.isPending || deleteCommentMutation.isPending || addCommentMutation.isPending}
                    aria-label={`Edit comment ${comment._id}`}
                  >
                    <PencilIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteConfirmation(comment._id)}
                    disabled={deleteCommentMutation.isPending} // Disable while deleting
                    aria-label={`Delete comment ${comment._id}`}
                  >
                    <Trash2Icon size={16} />
                  </Button>
                </div>
              )}
              {/* You could add reply button, like button for comments here */}
            </div>
          </div>
        ))
      ) : (
        // Show message if no comments yet
        <div className="text-center text-slate-500">No comments yet. Be the first to comment!</div>
      )}

      {/* Edit Comment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>
              Update your comment.
            </DialogDescription>
          </DialogHeader>
          {/* Edit Form */}
          <form onSubmit={confirmUpdateComment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                {/* Use label element for accessibility */}
                <label htmlFor="commentContent" className="text-right">
                  Comment
                </label>
                <Input
                  id="commentContent"
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  className="col-span-3"
                  disabled={updateCommentMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              {/* Use type="button" for the cancel button to prevent form submission */}
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              {/* The Save button is a submit button for the form */}
              <Button
                type="submit" // This button will submit the form
                disabled={updateCommentMutation.isPending || !editedComment.trim()} // Disable if pending or comment is empty
              >
                {updateCommentMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDeleteComment}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommentsSection;