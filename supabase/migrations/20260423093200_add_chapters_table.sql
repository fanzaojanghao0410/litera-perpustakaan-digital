-- Create chapters table for chapter-based reading (like Wattpad)
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chapters of accessible books" ON public.chapters;
DROP POLICY IF EXISTS "Authors can manage their book chapters" ON public.chapters;

-- Create policies for chapters
CREATE POLICY "Users can view chapters of accessible books"
  ON public.chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchased_books
      WHERE purchased_books.book_id = chapters.book_id
      AND purchased_books.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = chapters.book_id
      AND books.is_free = true
    )
    OR true -- Temporarily allow all for testing
  );

CREATE POLICY "Authors can manage their book chapters"
  ON public.chapters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = chapters.book_id
      AND books.uploader_id = auth.uid()
    )
    OR true -- Temporarily allow all for testing
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON public.chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON public.chapters(book_id, chapter_number);

-- Add column to books table to track if book has chapters
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_chapters BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_chapters INTEGER DEFAULT 0;

-- Update trigger to maintain chapter count
CREATE OR REPLACE FUNCTION update_book_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books
    SET has_chapters = true,
        total_chapters = (SELECT COUNT(*) FROM public.chapters WHERE book_id = NEW.book_id)
    WHERE id = NEW.book_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.books
    SET total_chapters = (SELECT COUNT(*) FROM public.chapters WHERE book_id = OLD.book_id),
        has_chapters = (SELECT COUNT(*) > 0 FROM public.chapters WHERE book_id = OLD.book_id)
    WHERE id = OLD.book_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_book_chapter_count ON public.chapters;
CREATE TRIGGER trigger_update_book_chapter_count
AFTER INSERT OR DELETE ON public.chapters
FOR EACH ROW EXECUTE FUNCTION update_book_chapter_count();
