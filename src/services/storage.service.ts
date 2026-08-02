import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'artisto-uploads';

/**
 * Upload a file buffer to Supabase Storage under the given prefix.
 * Returns the public URL and the storage path key (needed for deletion later).
 */
export async function uploadToStorage(
  file: Express.Multer.File,
  prefix: string
): Promise<{ url: string; key: string }> {
  const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || '';
  const key = `${prefix}/${randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Supabase Storage upload error: Bucket '${BUCKET}' not found. Please create it in the Supabase Dashboard and make it public.`);
    }
    throw new Error(`Supabase Storage upload error: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(key);

  return { url: publicUrlData.publicUrl, key };
}

/**
 * Delete an object from Supabase Storage by its key.
 */
export async function deleteFromStorage(key: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([key]);

  if (error) {
    console.error('Failed to delete file from Supabase Storage:', error.message);
  }
}
