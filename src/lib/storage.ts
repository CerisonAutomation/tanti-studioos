// Supabase Storage bucket configuration
// Run this in Supabase SQL Editor to create buckets

/*
-- Create buckets for Tanti StudioOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('floorplans', 'floorplans', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('moodboards', 'moodboards', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('documents', 'documents', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Storage policies (RLS)
-- Floorplans: Allow all authenticated users
CREATE POLICY "Public access for floorplans" ON storage.objects
  FOR SELECT USING (bucket_id = 'floorplans');

CREATE POLICY "Authenticated upload to floorplans" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'floorplans' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update floorplans" ON storage.objects
  FOR UPDATE USING (bucket_id = 'floorplans' AND auth.role() = 'authenticated');

-- Same for other buckets...
*/

// Bucket types
export type BucketName = 'floorplans' | 'moodboards' | 'documents' | 'avatars'

export const BUCKET_LIMITS: Record<BucketName, { maxSize: number; allowedTypes: string[] }> = {
  floorplans: { maxSize: 50 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] },
  moodboards: { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  documents: { maxSize: 10 * 1024 * 1024, allowedTypes: ['application/pdf', 'application/msword'] },
  avatars: { maxSize: 2 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
}

// Helper to validate file
export function validateFile(file: File, bucket: BucketName): string | null {
  const limit = BUCKET_LIMITS[bucket]
  if (file.size > limit.maxSize) return `File too large. Max ${limit.maxSize / 1024 / 1024}MB`
  if (!limit.allowedTypes.includes(file.type)) return `Invalid file type`
  return null
}