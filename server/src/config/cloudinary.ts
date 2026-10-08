import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
export { cloudinary };

export interface ICloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType?: string;
  bytes?: number;
  format?: string;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;
  if (
    cloudName.includes('your_') ||
    cloudName.includes('|') ||
    !/^[a-zA-Z0-9_-]+$/.test(cloudName)
  ) {
    return false;
  }
  if (apiKey.includes('your_') || apiSecret.includes('your_')) return false;

  return true;
}

function uploadStream(
  buffer: Buffer,
  options: Record<string, any>
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('Cloudinary upload returned empty response'));
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadImageToCloudinary(
  fileInput: Buffer | string,
  folder: string,
  filename?: string
): Promise<ICloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    console.warn(
      `[Cloudinary] Credentials not fully configured. Using development mock asset for folder: ${folder}`
    );
    const mockId = `mock_${folder.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    return {
      url: `/uploads/${folder}/${Date.now()}_${filename || 'profile.jpg'}`,
      publicId: mockId,
      resourceType: 'image',
    };
  }

  try {
    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };

    if (filename) {
      uploadOptions.public_id = `${Date.now()}_${filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')}`;
    }

    let result: UploadApiResponse;
    if (Buffer.isBuffer(fileInput)) {
      result = await uploadStream(fileInput, uploadOptions);
    } else {
      result = await cloudinary.uploader.upload(fileInput, uploadOptions);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error: any) {
    console.warn('[Cloudinary] Image upload remote call warning:', error?.message || error);
    if (process.env.NODE_ENV !== 'production') {
      const mockId = `mock_${folder.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      return {
        url: `/uploads/${folder}/${Date.now()}_${filename || 'profile.jpg'}`,
        publicId: mockId,
        resourceType: 'image',
      };
    }
    throw new Error('File upload failed. Unable to store image asset.');
  }
}

export async function uploadPdfToCloudinary(
  fileInput: Buffer | string,
  folder: string,
  filename?: string
): Promise<ICloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    console.warn(
      `[Cloudinary] Credentials not fully configured. Using development mock asset for PDF document in: ${folder}`
    );
    const mockId = `mock_${folder.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    return {
      url: `/uploads/${folder}/${Date.now()}_${filename || 'document.pdf'}`,
      publicId: mockId,
      resourceType: 'raw',
    };
  }

  try {
    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: 'raw',
    };

    if (filename) {
      uploadOptions.public_id = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9-_.]/g, '_')}`;
    }

    let result: UploadApiResponse;
    if (Buffer.isBuffer(fileInput)) {
      result = await uploadStream(fileInput, uploadOptions);
    } else {
      result = await cloudinary.uploader.upload(fileInput, uploadOptions);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format || 'pdf',
    };
  } catch (error: any) {
    console.warn('[Cloudinary] PDF upload remote call warning:', error?.message || error);
    if (process.env.NODE_ENV !== 'production') {
      const mockId = `mock_${folder.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      return {
        url: `/uploads/${folder}/${Date.now()}_${filename || 'document.pdf'}`,
        publicId: mockId,
        resourceType: 'raw',
      };
    }
    throw new Error('File upload failed. Unable to store document asset.');
  }
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<boolean> {
  if (!publicId || publicId.startsWith('mock_')) {
    return true;
  }

  if (!isCloudinaryConfigured()) {
    return true;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok' || result.result === 'not found';
  } catch (error: any) {
    console.error(`[Cloudinary] Failed to delete asset ${publicId}:`, error?.message || error);
    return false;
  }
}
