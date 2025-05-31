import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; // Assuming fs is still needed elsewhere or just leave it
import { UploadApiResponse, DeleteApiResponse } from 'cloudinary'; // Import relevant types from Cloudinary

// Cloudinary configuration - ensure these are in your .env file
// ... (cloudinary.config block)

/**
 * Uploads a file from a local path to Cloudinary.
 * Deletes the local file after upload attempt.
 * @param localFilePath - The local path to the file.
 * @returns A Promise resolving to the Cloudinary upload response or null if upload fails.
 */
const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
    // ... (uploadOnCloudinary implementation remains the same)
    try {
      if (!localFilePath) {
      console.log("No local file path provided for Cloudinary upload.");
      return null;
      }

      // Upload the file to Cloudinary
      const response: UploadApiResponse = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto" // Automatically detect resource type (image, video, raw)
      });

      // console.log("File uploaded", response.url); // Optional log
      // console.log("Cloudy response", response); // Optional log

      // Delete the local file after successful upload
      fs.unlinkSync(localFilePath);
      console.log(`Deleted local file: ${localFilePath}`); // Confirmation log

      return response; // Return the Cloudinary response object

    } catch (error: any) { // Catch any error during upload or unlink
      console.error(`Error during Cloudinary upload or local file deletion: ${error.message}`);

      // Attempt to delete the local file even if upload failed
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
          console.log(`Deleted local file after error: ${localFilePath}`);
        } catch (unlinkError: any) {
          console.error(`Failed to delete local file after error: ${localFilePath}`, unlinkError);
        }
      }

      return null; // Return null to indicate failure
    }
};

/**
 * Deletes a resource from Cloudinary using its public ID.
 * @param publicId - The public ID of the resource to delete.
 * @returns A Promise resolving to the Cloudinary delete response or null on failure.
 */
const deleteImageFromCloudinary = async (publicId: string): Promise<DeleteApiResponse | null> => {
  try {
    if (!publicId) {
      console.log("No public ID provided for Cloudinary deletion.");
      return null;
    }

    const result: DeleteApiResponse = await cloudinary.api.delete_resources([publicId]);

    // --- FIX for TypeScript error: Property 'deleted' does not exist on type 'DeleteApiResponse' ---
    // The DeleteApiResponse type from the library might not fully represent the actual
    // runtime response for delete_resources, which includes a 'deleted' property.
    // We use a type assertion here to tell TypeScript that we expect 'deleted' to exist.
    const deleteResultWithDeleted = result as { deleted?: { [key: string]: string }, errors?: any };
    // Using optional chaining (?.) on 'deleted' property access for safety.
    // Checking if deleteResultWithDeleted and deleteResultWithDeleted.deleted exist before accessing publicId key.


    // Cloudinary's delete_resources returns an object with { deleted: { public_id: 'deleted' | 'not_found' }, ... }
    // or potentially { errors: { public_id: 'reason' }, ... }
    // Check if the public ID was successfully marked as 'deleted'
    if (deleteResultWithDeleted?.deleted?.[publicId] === 'deleted') {
        // Indicate success by returning the result (or true/void depending on desired return)
       return result; // Return the original result as the function signature expects DeleteApiResponse | null
    }
    // If the status is not 'deleted', it might be 'not_found' or an error
    else if (deleteResultWithDeleted?.deleted?.[publicId] === 'not_found') {
         console.warn(`Cloudinary deletion: Resource with public ID ${publicId} not found.`);
         return null; // Treat as a failure case for deletion purposes
    }
    // Handle potential errors array in the response if delete_resources returns partial failures
    else if (deleteResultWithDeleted?.errors?.[publicId]) {
         console.error(`Cloudinary deletion error for ${publicId}:`, deleteResultWithDeleted.errors[publicId]);
         return null; // Treat as a failure
    }
     // Fallback for unexpected response structure
    else {
       console.warn(`Cloudinary deletion: Unexpected response structure for ${publicId}.`, deleteResultWithDeleted);
       return null; // Indicate failure
    }


  } catch (error: any) {
    console.error(`Error during Cloudinary API call for deletion (publicId: ${publicId}): ${error.message}`);
    // If a fundamental API error occurs (not just a resource not found), it's caught here
    return null; // Indicate failure
  }
};


export { uploadOnCloudinary, deleteImageFromCloudinary };