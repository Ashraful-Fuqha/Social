"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIResponse = void 0;
/**
 * Standard API Response class for consistent response structure.
 */
class APIResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400; // Indicate success based on status code
    }
}
exports.APIResponse = APIResponse;
