// src/middleware/clerkAuth.ts
import { Request } from 'express';
import { IUser }  from '../models/UserSchema';

// Define the interface for the request object after ClerkExpressRequireAuth middleware
// This matches the properties Clerk adds to the request.
export interface IAuthRequest extends Request {
    auth: {
        userId: string | null; // The authenticated user's Clerk ID
        sessionId: string | null; // The authenticated session ID
        orgId: string | null; // The authenticated organization ID 
    };
    user?: IUser; 
}
