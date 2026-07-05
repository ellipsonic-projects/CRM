import { NextFunction, Request, Response } from 'express';

import { UploadService } from './upload.service';

export class UploadController {
  constructor(private readonly uploadService = new UploadService()) {}

  uploadImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Please select an image to upload.',
        });
        return;
      }

      const folder =
        typeof req.body.folder === 'string' && req.body.folder.trim()
          ? req.body.folder.trim()
          : 'bondgrid/documents';

      const uploaded = await this.uploadService.uploadImage(
        req.file.buffer,
        folder,
      );

      res.status(201).json({
        success: true,
        data: uploaded,
      });
    } catch (error) {
      next(error);
    }
  };
}
