/**
 * Standard API Response class for consistent response structure.
 */
class APIResponse<T> { // Use a generic type T for the data property
    statusCode: number;
    message: string;
    data: T | null; // Data can be of type T or null
    success: boolean;

    constructor(statusCode: number, data: T | null, message: string = "Success") {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400; // Indicate success based on status code
    }
}

export { APIResponse };