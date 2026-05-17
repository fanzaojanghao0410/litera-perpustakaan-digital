-- Create table for tracking unique book views (readers)
CREATE TABLE IF NOT EXISTS public.book_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous tracking
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for registered users (one view per user per book)
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_views_user_unique 
ON public.book_views(book_id, user_id) 
WHERE user_id IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON public.book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_user_id ON public.book_views(user_id);
CREATE INDEX IF NOT EXISTS idx_book_views_viewed_at ON public.book_views(viewed_at);

-- Enable RLS
ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Book views are viewable by everyone" 
ON public.book_views FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own view" 
ON public.book_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to count unique readers for a book
CREATE OR REPLACE FUNCTION public.get_book_reader_count(book_uuid UUID)
RETURNS INTEGER
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))::INTEGER
  FROM public.book_views
  WHERE book_id = book_uuid;
$$;

-- Function to increment book view (called when user reads a book)
CREATE OR REPLACE FUNCTION public.record_book_view(
  book_uuid UUID,
  user_uuid UUID DEFAULT NULL,
  session_id_text TEXT DEFAULT NULL,
  ip_text TEXT DEFAULT NULL,
  agent_text TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert view record (will skip if unique constraint violated)
  INSERT INTO public.book_views (book_id, user_id, session_id, ip_address, user_agent)
  VALUES (book_uuid, user_uuid, session_id_text, ip_text, agent_text)
  ON CONFLICT (book_id, user_id) DO NOTHING;
  
  -- Update total_reads counter on books table
  UPDATE public.books 
  SET total_reads = (
    SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))
    FROM public.book_views
    WHERE book_id = book_uuid
  )
  WHERE id = book_uuid;
END;
$$;

-- Create view for book statistics
CREATE OR REPLACE VIEW public.book_statistics AS
SELECT 
  b.id as book_id,
  b.title,
  b.total_reads,
  COUNT(DISTINCT bv.user_id) as unique_registered_readers,
  COUNT(DISTINCT CASE WHEN bv.user_id IS NULL THEN bv.session_id END) as anonymous_readers,
  COUNT(DISTINCT COALESCE(bv.user_id::text, bv.session_id)) as total_unique_readers,
  MAX(bv.viewed_at) as last_read_at
FROM public.books b
LEFT JOIN public.book_views bv ON b.id = bv.book_id
GROUP BY b.id, b.title, b.total_reads;

-- Grant access to the view
GRANT SELECT ON public.book_statistics TO authenticated;
GRANT SELECT ON public.book_statistics TO anon;
