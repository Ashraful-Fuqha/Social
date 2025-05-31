import React, { useState, useRef } from 'react';
import { useUploadVideoMutation } from '../store/api/mutations'; 
import { useNavigate } from 'react-router-dom'; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner'; 


function UploadVideoPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const videoFileInputRef = useRef<HTMLInputElement>(null); 
    const thumbnailFileInputRef = useRef<HTMLInputElement>(null); 


    const navigate = useNavigate(); 

    // Get the mutation hook
    const {
        mutate: uploadVideo,
        isPending,
        isError,
        error,
        reset
    } = useUploadVideoMutation();

    // Handle video file input change
    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
        } else {
            setVideoFile(null);
            if (videoFileInputRef.current) {
            videoFileInputRef.current.value = "";
            }
            toast("Invalid file type", {
            description: "Please select a valid video file.",
            });
        }
    };

        // Handle thumbnail file input change
    const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type.startsWith('image/')) {
            setThumbnailFile(file);
        } else {
            setThumbnailFile(null);
            if (thumbnailFileInputRef.current) {
                thumbnailFileInputRef.current.value = "";
            }
            toast("Invalid file type", {
                description: "Please select a valid image file for the thumbnail.",
            });
        }
    };


// Handle form submission
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!title.trim() || !videoFile || !thumbnailFile) {
            toast("Missing Information", {
            description: "Please fill in title, select a video file, select a thumbnail, and provide a valid duration.",
            });
            return;
        }

        // Create FormData object
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('videoFile', videoFile); // 'videoFile' must match the field name in Multer upload.single()
        formData.append('thumbnailFile', thumbnailFile); // Append thumbnail file - 'thumbnailFile' should match backend field name
        // formData.append('duration', String(duration)); // Send duration as a string or number based on backend expectation

        // Trigger the mutation
        uploadVideo(formData, {
            onSuccess: (data) => {
                toast("Upload Successful", {
                description: data?.message || "Your video has been uploaded!",
                });
                setTitle('');
                setDescription('');
                setVideoFile(null);
                setThumbnailFile(null); 
                if (videoFileInputRef.current) {
                    videoFileInputRef.current.value = "";
                }
                if (thumbnailFileInputRef.current) {
                    thumbnailFileInputRef.current.value = "";
                }
                reset(); // Reset mutation state

                if (data?.video?._id) {
                    setTimeout(() => navigate('/home'), 1500);
                } else {
                    setTimeout(() => navigate('/home'), 1500);
                }
            },
            onError: (error: any) => {
                toast("Upload Failed", {
                description: error.response?.data?.message || error.message || "An error occurred during upload.",
                });
                console.error("Upload errors:", error.response?.data?.errors);
            }
        });
    };

    return (
    <div className="container mx-auto p-4 max-w-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">Upload New Video</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className=''>
            <Label htmlFor="title" className='mb-2 text-[1rem] px-2 font-semibold'>Title</Label>
            <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isPending}
            />
        </div>
        <div>
            <Label htmlFor="description" className='mb-2 text-[1rem] px-2 font-semibold'>Description</Label>
            <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={isPending}
            />
        </div>
        <div>
            <Label htmlFor="thumbnailFile" className='mb-2 text-[1rem] px-2 font-semibold'>Thumbnail Image</Label>
            <Input
            id="thumbnailFile"
            type="file"
            accept="image/*" 
            onChange={handleThumbnailFileChange}
            required 
            disabled={isPending}
            ref={thumbnailFileInputRef}
            />
            {thumbnailFile && <p className="text-sm text-muted-foreground mt-1">Selected thumbnail: {thumbnailFile.name}</p>}
        </div>

        {/* Video File Input */}
        <div>
            <Label htmlFor="videoFile"  className='mb-2 text-[1rem] px-2 font-semibold'>Video File</Label>
            <Input
            id="videoFile"
            type="file"
            accept="video/*" 
            onChange={handleVideoFileChange}
            required
            disabled={isPending}
            ref={videoFileInputRef} 
            />
            {videoFile && <p className="text-sm text-muted-foreground mt-1">Selected video: {videoFile.name}</p>}
        </div>


        {/* --- Feedback --- */}
        {isPending && (
            <div className="text-blue-600">Uploading...</div>
        )}

        <Button type="submit" className="w-full" disabled={isPending || !videoFile || !thumbnailFile || !title.trim()}>
            {isPending ? 'Uploading...' : 'Upload Video'}
        </Button>
        </form>


        {isError && error.response?.data?.errors && (
            <div className="mt-4 text-red-600">
                <p>Details:</p>
                <ul>
                    {error.response.data.errors.map((err: any, index: number) => (
                    <li key={index}>{JSON.stringify(err)}</li>
                    ))}
                </ul>
            </div>
        )}

        </div>
    );
}

export default UploadVideoPage;