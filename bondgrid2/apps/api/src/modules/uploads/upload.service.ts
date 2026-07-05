import { CloudinaryService } from './cloudinary.service';
import { UploadedImage } from './upload.types';

export class UploadService {
  constructor(private readonly cloudinaryService = new CloudinaryService()) {}

  uploadImage(buffer: Buffer, folder: string): Promise<UploadedImage> {
    return this.cloudinaryService.uploadImage(buffer, folder);
  }

  deleteImage(publicId?: string): Promise<void> {
    return this.cloudinaryService.deleteImage(publicId);
  }
}
