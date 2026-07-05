import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { createReadStream } from 'streamifier';

import { env } from '../../config/env';
import { UploadedImage } from './upload.types';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export class CloudinaryService {
  async uploadImage(buffer: Buffer, folder: string): Promise<UploadedImage> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, response) => {
            if (error || !response) {
              reject(error ?? new Error('Image upload failed.'));
              return;
            }

            resolve(response);
          },
        );

        createReadStream(buffer).pipe(uploadStream);
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('cloudinary')
      ) {
        throw new Error('Could not connect to Cloudinary.');
      }

      throw new Error('Image upload failed.');
    }
  }

  async deleteImage(publicId?: string): Promise<void> {
    if (!publicId) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch {
      throw new Error('Image upload failed.');
    }
  }
}
