-- Create chapters table for Wattpad-style reading
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_url TEXT,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON chapters(chapter_number);

-- Add RLS policies
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read chapters of free books or free chapters
CREATE POLICY "Chapters are viewable by everyone" 
ON chapters FOR SELECT 
USING (
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
);

-- Policy: Only book uploader can insert chapters
CREATE POLICY "Only uploader can insert chapters" 
ON chapters FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = chapters.book_id 
    AND books.uploader_id = auth.uid()
  )
);

-- Policy: Only book uploader can update chapters
CREATE POLICY "Only uploader can update chapters" 
ON chapters FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = chapters.book_id 
    AND books.uploader_id = auth.uid()
  )
);

-- Policy: Only book uploader can delete chapters
CREATE POLICY "Only uploader can delete chapters" 
ON chapters FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = chapters.book_id 
    AND books.uploader_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_chapters_updated_at();

-- Add chapter_count column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS chapter_count INTEGER DEFAULT 0;

-- Function to update chapter count
CREATE OR REPLACE FUNCTION update_book_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE books SET chapter_count = chapter_count + 1 WHERE id = NEW.book_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE books SET chapter_count = chapter_count - 1 WHERE id = OLD.book_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chapter count
DROP TRIGGER IF EXISTS update_book_chapter_count ON chapters;
CREATE TRIGGER update_book_chapter_count
  AFTER INSERT OR DELETE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_book_chapter_count();
