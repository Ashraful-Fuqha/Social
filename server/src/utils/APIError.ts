/**
 * Custom API Error class extending the built-in Error.
 * Provides structured error information for API responses.
 */
class ApiError extends Error {
    statusCode: number;
    data: null; // Typically null for an error response body
    message: string;
    errors: any[]; // Array of additional error details (can be more specific if needed)
    success: boolean; // Should be false for an error

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: any[] = [],
        stack?: string // stack is optional
    ) {
        super(message); // Call the parent Error constructor with the message

        this.statusCode = statusCode;
        this.data = null; // Data is usually null on error
        this.message = message;
        this.errors = errors;
        this.success = false; // Indicate failure

        // Capture stack trace for better debugging if not provided
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };