import multer from 'multer';

/**
 * Multer config — memory storage (Render's filesystem is ephemeral,
 * and we forward straight to S3 anyway).
 * 
 * - 5MB file size limit
 * - Only image/jpeg, image/png, image/webp allowed
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});
