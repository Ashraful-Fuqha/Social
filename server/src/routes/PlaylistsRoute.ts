import express from "express";
import {
    createPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
} from "../controller/PlaylistController"
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { findOrCreateUser } from "../controller/UserController";

const router = express.Router()

router.use(clerkMiddleware())
router.use(requireAuth())
router.use(findOrCreateUser)

router.get("/:playlistId", getPlaylistById)
router.post("/create", createPlaylist)


router.patch("/update/:playlistId", updatePlaylist)
router.post("/:playlistId/videos", addVideoToPlaylist)
router.post("/:playlistId/videos/:videoId", removeVideoFromPlaylist)
router.delete("/delete/:playlistId", deletePlaylist)

export default router