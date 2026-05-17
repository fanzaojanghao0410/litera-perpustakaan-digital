-- Add status column to chapters table (keep as VARCHAR to avoid casting issues)
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- Add check constraint to ensure valid status values
ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_status_check;
ALTER TABLE chapters ADD CONSTRAINT chapters_status_check 
  CHECK (status IN ('draft', 'published'));

-- Update RLS policy to only show published chapters to readers
-- Authors can see all their chapters
DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON chapters;

CREATE POLICY "Chapters are viewable by everyone" 
ON chapters FOR SELECT 
USING (
  -- Author can see all their chapters
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = chapters.book_id 
    AND books.uploader_id = auth.uid()
  )
  OR 
  -- Others can only see published chapters
  (
    status = 'published'
    AND (
      is_free = true 
      OR EXISTS (
        SELECT 1 FROM books 
        WHERE books.id = chapters.book_id 
        AND books.is_free = true
      )
      OR EXISTS (
        SELECT 1 FROM purchased_books 
        WHERE purchased_books.book_id = chapters.book_id 
        AND purchased_books.user_id = auth.uid()
      )
    )
  )
);

-- Add word_count column for analytics
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- Add views column for analytics
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add likes column for social features
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
