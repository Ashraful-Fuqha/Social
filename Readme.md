
-----

# Social. - A Modern Video Sharing Platform

**Social.** is a robust and intuitive video sharing platform, offering users a seamless experience to consume, create, and interact with video content. Built with a modern and scalable full-stack architecture, Social. provides features familiar to popular video platforms, wrapped in a sleek, responsive user interface. This project was conceptualized and built from scratch in just **20 days**, demonstrating rapid development capabilities with **bare minimum assistance from AI**.

-----

## ✨ Key Features

  * **Secure User Authentication:** Powered by **Clerk**, providing robust and customizable user sign-up, sign-in, and session management.
  * **Comprehensive User Profiles:** Users can manage their account settings via Clerk's integrated UI, and also view public profiles of other users/channels.
  * **Video Upload & Management:** Seamlessly upload video content, complete with thumbnails, title, and description.
  * **Dynamic Video Playback:** An integrated video player delivers a smooth and engaging viewing experience.
  * **Personalized Watch History:** Automatically tracks viewed videos, allowing users to easily revisit their past content. Full control to clear history is also available.
  * **Engaging Interactions:** Users can express themselves by liking and disliking videos.
  * **Channel Subscriptions:** Follow your favorite creators by subscribing to their channels and staying updated with their latest content.
  * **Comments Section:** Engage in discussions by posting comments on videos and viewing existing conversations.
  * **Playlist Management:** Organize and curate videos into custom playlists for personalized viewing experiences.
  * **Global Search (Basic):** A functional search bar to find videos.
  * **Responsive User Interface:** Designed with **Shadcn UI** and **Tailwind CSS**, ensuring a modern, adaptive, and visually appealing experience across all devices.
  * **Dark Mode Toggle:** A convenient dark mode option for comfortable viewing.

-----

## 🚀 Tech Stack

Social. is built with a powerful combination of modern technologies, ensuring performance, scalability, and a great developer experience.

### Frontend

  * **React:** The core JavaScript library for building interactive user interfaces.
  * **TypeScript:** Provides static type-checking, enhancing code quality, readability, and maintainability.
  * **React Router DOM:** For declarative routing within the single-page application.
  * **Zustand:** A fast, lightweight, and scalable state management solution for React, used for global client-side state.
  * **React Query (TanStack Query):** An essential library for managing, caching, and synchronizing server-state in React, providing automatic refetching, background updates, and optimistic UI.
  * **Shadcn UI:** A collection of beautifully designed, re-usable UI components (built on Radix UI and styled with Tailwind CSS) for a consistent and accessible design system.
  * **Tailwind CSS:** A utility-first CSS framework that enables rapid UI development and highly customized designs.
  * **Sonner:** An elegant and accessible toast library for displaying notifications and user feedback.

### Backend

  * **Node.js:** The JavaScript runtime environment powering the server-side logic.
  * **Express.js:** A fast, unopinionated, minimalist web framework for Node.js, forming the RESTful API layer.
  * **MongoDB:** A flexible, scalable NoSQL document database used for persistent data storage.
  * **Mongoose:** An elegant MongoDB object modeling tool for Node.js, simplifying interactions with the database through schemas.
  * **Clerk (Authentication):** Integrated for robust authentication, handling user sign-up, sign-in, and session management securely. Its webhooks keep user data synchronized.
  * **Cloudinary:** A cloud-based media management platform used for efficient storage, optimization, and delivery of video assets, thumbnails, and user avatars.
  * **JSON Web Tokens (JWT):** Used for secure, stateless API authentication.
  * **bcryptjs:** For hashing user passwords to ensure robust security.
  * **Other Essential Libraries:** `cors`, `cookie-parser`, `dotenv`, `multer` (for file uploads), `express-async-handler` (for simplified error handling), `zod` (for schema validation).

-----

## 🚧 Struggles and Challenges

Building a full-stack application with a rich feature set in a limited timeframe presented several exciting challenges:

  * **Complex Clerk Integration:** While Clerk simplifies authentication, integrating its robust features (like webhooks for user data synchronization with the backend and handling session management across different API calls) required a deep understanding of its lifecycle and careful backend implementation.
  * **Efficient State Management:** Managing user-specific data (likes, subscriptions, watch history, playlists) across various components and ensuring a reactive UI required a thoughtful approach using Zustand for global state and React Query for server-side data synchronization. Preventing stale data and unnecessary re-renders was a continuous refinement process.
  * **Frontend-Backend API Design:** Designing a clear, consistent, and secure RESTful API for all functionalities, including complex relationships (e.g., videos and their owners, comments, likes), was crucial. This involved meticulous planning of routes, request/response structures, and error handling.
  * **Cloudinary Media Handling:** Implementing robust video and image upload, processing (e.g., thumbnail generation), and efficient delivery using Cloudinary's API posed unique challenges in file handling and ensuring optimal media performance.
  * **Database Schema Optimization:** Crafting efficient MongoDB schemas and choosing appropriate indexing strategies for fast queries, especially for features like watch history (which required specific ordering and population), was key to performance.
  * **Rapid Iteration & Problem Solving:** The tight **20-day deadline** necessitated quick decision-making, rapid prototyping, and efficient debugging. Each new feature brought its own set of unique technical hurdles that had to be overcome swiftly.
  * **Minimal AI Dependence:** Relying predominantly on documentation, official guides, and conventional problem-solving (Stack Overflow, debugging) rather than heavy AI prompting for complex architectural decisions fostered a deeper understanding of each technology.

-----