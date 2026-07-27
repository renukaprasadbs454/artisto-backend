import multer from 'multer';

/**
 * Multer config — memory storage (Render's filesystem is ephemeral,
 * and we forward straight to S3 anyway).
 * 
 * - 1MB file size limit
 * - Only .jpg/.jpeg, .png, .webp extensions allowed (also checks mimetype)
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const original = file.originalname || '';
    const lower = original.toLowerCase();
    const hasAllowedExt = allowedExts.some((ext) => lower.endsWith(ext));

    if (!hasAllowedExt) {
      cb(new Error('Invalid file type. Only JPG, PNG and WebP extensions are allowed.'));
      return;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPG, PNG and WebP are allowed.'));
      return;
    }

    cb(null, true);
  },
});
