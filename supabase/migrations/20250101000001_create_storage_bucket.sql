-- Create storage bucket for budget files
INSERT INTO storage.buckets (id, name, public)
VALUES ('budget-files', 'budget-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for budget-files bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own budget files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'budget-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own files
CREATE POLICY "Users can view their own budget files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'budget-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own budget files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'budget-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public access to files (since we're using public URLs)
CREATE POLICY "Public can view budget files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'budget-files');
