"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.uploadOnCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs")); // Assuming fs is still needed elsewhere or just leave it
// Cloudinary configuration - ensure these are in your .env file
// ... (cloudinary.config block)
/**
 * Uploads a file from a local path to Cloudinary.
 * Deletes the local file after upload attempt.
 * @param localFilePath - The local path to the file.
 * @returns A Promise resolving to the Cloudinary upload response or null if upload fails.
 */
const uploadOnCloudinary = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    // ... (uploadOnCloudinary implementation remains the same)
    try {
        if (!localFilePath) {
            console.log("No local file path provided for Cloudinary upload.");
            return null;
        }
        // Upload the file to Cloudinary
        const response = yield cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "auto" // Automatically detect resource type (image, video, raw)
        });
        // console.log("File uploaded", response.url); // Optional log
        // console.log("Cloudy response", response); // Optional log
        // Delete the local file after successful upload
        fs_1.default.unlinkSync(localFilePath);
        console.log(`Deleted local file: ${localFilePath}`); // Confirmation log
        return response; // Return the Cloudinary response object
    }
    catch (error) { // Catch any error during upload or unlink
        console.error(`Error during Cloudinary upload or local file deletion: ${error.message}`);
        // Attempt to delete the local file even if upload failed
        if (fs_1.default.existsSync(localFilePath)) {
            try {
                fs_1.default.unlinkSync(localFilePath);
                console.log(`Deleted local file after error: ${localFilePath}`);
            }
            catch (unlinkError) {
                console.error(`Failed to delete local file after error: ${localFilePath}`, unlinkError);
            }
        }
        return null; // Return null to indicate failure
    }
});
exports.uploadOnCloudinary = uploadOnCloudinary;
/**
 * Deletes a resource from Cloudinary using its public ID.
 * @param publicId - The public ID of the resource to delete.
 * @returns A Promise resolving to the Cloudinary delete response or null on failure.
 */
const deleteImageFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!publicId) {
            console.log("No public ID provided for Cloudinary deletion.");
            return null;
        }
        const result = yield cloudinary_1.v2.api.delete_resources([publicId]);
        // --- FIX for TypeScript error: Property 'deleted' does not exist on type 'DeleteApiResponse' ---
        // The DeleteApiResponse type from the library might not fully represent the actual
        // runtime response for delete_resources, which includes a 'deleted' property.
        // We use a type assertion here to tell TypeScript that we expect 'deleted' to exist.
        const deleteResultWithDeleted = result;
        // Using optional chaining (?.) on 'deleted' property access for safety.
        // Checking if deleteResultWithDeleted and deleteResultWithDeleted.deleted exist before accessing publicId key.
        // Cloudinary's delete_resources returns an object with { deleted: { public_id: 'deleted' | 'not_found' }, ... }
        // or potentially { errors: { public_id: 'reason' }, ... }
        // Check if the public ID was successfully marked as 'deleted'
        if (((_a = deleteResultWithDeleted === null || deleteResultWithDeleted === void 0 ? void 0 : deleteResultWithDeleted.deleted) === null || _a === void 0 ? void 0 : _a[publicId]) === 'deleted') {
            // Indicate success by returning the result (or true/void depending on desired return)
            return result; // Return the original result as the function signature expects DeleteApiResponse | null
        }
        // If the status is not 'deleted', it might be 'not_found' or an error
        else if (((_b = deleteResultWithDeleted === null || deleteResultWithDeleted === void 0 ? void 0 : deleteResultWithDeleted.deleted) === null || _b === void 0 ? void 0 : _b[publicId]) === 'not_found') {
            console.warn(`Cloudinary deletion: Resource with public ID ${publicId} not found.`);
            return null; // Treat as a failure case for deletion purposes
        }
        // Handle potential errors array in the response if delete_resources returns partial failures
        else if ((_c = deleteResultWithDeleted === null || deleteResultWithDeleted === void 0 ? void 0 : deleteResultWithDeleted.errors) === null || _c === void 0 ? void 0 : _c[publicId]) {
            console.error(`Cloudinary deletion error for ${publicId}:`, deleteResultWithDeleted.errors[publicId]);
            return null; // Treat as a failure
        }
        // Fallback for unexpected response structure
        else {
            console.warn(`Cloudinary deletion: Unexpected response structure for ${publicId}.`, deleteResultWithDeleted);
            return null; // Indicate failure
        }
    }
    catch (error) {
        console.error(`Error during Cloudinary API call for deletion (publicId: ${publicId}): ${error.message}`);
        // If a fundamental API error occurs (not just a resource not found), it's caught here
        return null; // Indicate failure
    }
});
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
