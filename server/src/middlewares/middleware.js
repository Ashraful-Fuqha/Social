"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
app.use(((err, req, res, next) => {
    console.error(err.stack);
    // Handle specific errors, e.g., Multer errors
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    res.status(err.status || 500).send(err.message || 'Something broke!');
}));
