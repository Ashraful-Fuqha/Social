import express from 'express';
import multer from 'multer';

const app = express();

app.use(((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  // Handle specific errors, e.g., Multer errors
   if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
  res.status(err.status || 500).send(err.message || 'Something broke!');
}) as express.ErrorRequestHandler);