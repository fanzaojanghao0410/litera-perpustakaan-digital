-- Create purchased_books table to track user's purchased books
CREATE TABLE public.purchased_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.purchased_books ENABLE ROW LEVEL SECURITY;

-- Create policies for purchased_books
CREATE POLICY "Users can view their own purchased books"
  ON public.purchased_books
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchased books"
  ON public.purchased_books
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_purchased_books_user_id ON public.purchased_books(user_id);
CREATE INDEX idx_purchased_books_book_id ON public.purchased_books(book_id);
