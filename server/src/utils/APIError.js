"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
/**
 * Custom API Error class extending the built-in Error.
 * Provides structured error information for API responses.
 */
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack // stack is optional
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
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.ApiError = ApiError;
