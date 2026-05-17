import { supabase } from './client';

export const BUCKETS = {
  BOOK_COVERS: 'book-covers',
  BOOK_FILES: 'book-files',
  AVATARS: 'avatars',
  LIBRARY_LOGOS: 'library-logos',
} as const;

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: options?.upsert ?? false });
  
  if (error) throw error;
  return data;
}

export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function uploadBookCover(userId: string, file: File) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  await uploadFile(BUCKETS.BOOK_COVERS, path, file);
  return getPublicUrl(BUCKETS.BOOK_COVERS, path);
}

export async function uploadBookFile(userId: string, file: File) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  await uploadFile(BUCKETS.BOOK_FILES, path, file);
  return path; // Return path only, not public URL since bucket is private
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  await uploadFile(BUCKETS.AVATARS, path, file, { upsert: true });
  return getPublicUrl(BUCKETS.AVATARS, path);
}

export async function uploadLibraryLogo(libraryId: string, file: File) {
  const ext = file.name.split('.').pop();
  const path = `${libraryId}/logo.${ext}`;
  await uploadFile(BUCKETS.LIBRARY_LOGOS, path, file, { upsert: true });
  return getPublicUrl(BUCKETS.LIBRARY_LOGOS, path);
}
