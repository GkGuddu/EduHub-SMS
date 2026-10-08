import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const isPdfMime =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype.toLowerCase().includes('pdf');
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files (.pdf) are allowed.'));
  }
};

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const isMimeOk = allowedMimes.includes(file.mimetype);
  const isExtOk = allowedExtensions.some((ext) =>
    file.originalname.toLowerCase().endsWith(ext)
  );

  if (isMimeOk || isExtOk) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP image files are allowed.'));
  }
};

const pdfUploader = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: pdfFileFilter,
});

const imageUploader = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
});

export function handleMulterUpload(
  multerMiddleware: (req: Request, res: Response, next: NextFunction) => void
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              success: false,
              message: 'File size exceeds 5 MB.',
            });
            return;
          }
          res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed.',
        });
        return;
      }
      next();
    });
  };
}

export const uploadSinglePdf = handleMulterUpload(pdfUploader.single('file'));
export const uploadSingleImage = handleMulterUpload(imageUploader.single('photo'));
