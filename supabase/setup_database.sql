-- ============================================
-- LITERA - DIGITAL E-BOOK PLATFORM
-- Complete Database Setup for Supabase
-- ============================================

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');

-- Create book status enum
CREATE TYPE public.book_status AS ENUM ('draft', 'pending', 'published', 'rejected');

-- Create borrowing status enum
CREATE TYPE public.borrowing_status AS ENUM ('active', 'expired', 'returned');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');

-- ============================================
-- TABLES
-- ============================================

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  library_id UUID REFERENCES public.libraries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ LIBRARIES ============
CREATE TABLE public.libraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2463EB',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============ BOOKS ============
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  synopsis TEXT,
  cover_url TEXT,
  file_url TEXT,
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_borrowable BOOLEAN DEFAULT true,
  borrow_duration INTEGER DEFAULT 7,
  status book_status DEFAULT 'pending',
  library_id UUID REFERENCES public.libraries(id),
  uploader_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_books_category ON public.books(category_id);
CREATE INDEX idx_books_library ON public.books(library_id);
CREATE INDEX idx_books_uploader ON public.books(uploader_id);
CREATE INDEX idx_books_status ON public.books(status);

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============ WISHLIST ============
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status order_status DEFAULT 'pending',
  payment_type TEXT,
  midtrans_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============ BORROWINGS ============
CREATE TABLE public.borrowings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status borrowing_status DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

-- ============ CHATS ============
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  library_id UUID REFERENCES public.libraries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_chat ON public.messages(chat_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Libraries
CREATE POLICY "Libraries are viewable by everyone" ON public.libraries FOR SELECT USING (true);
CREATE POLICY "Admins can manage libraries" ON public.libraries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Books
CREATE POLICY "Published books are viewable by everyone" ON public.books FOR SELECT USING (status = 'published' OR auth.uid() = uploader_id);
CREATE POLICY "Authenticated users can create books" ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Uploaders can update own books" ON public.books FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Uploaders can delete own books" ON public.books FOR DELETE USING (auth.uid() = uploader_id);

-- Reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Borrowings
CREATE POLICY "Users can view own borrowings" ON public.borrowings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own borrowings" ON public.borrowings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update borrowings" ON public.borrowings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Chats
CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "Chat participants can view messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() IN (
    SELECT user_id FROM public.chats WHERE id = chat_id
  )
);
CREATE POLICY "Chat participants can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('book-files', 'book-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('library-logos', 'library-logos', true);

-- Storage policies
CREATE POLICY "Book covers are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Authenticated users can upload book covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read book files" ON storage.objects FOR SELECT USING (bucket_id = 'book-files' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload book files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-files' AND auth.role() = 'authenticated');

CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Library logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'library-logos');
CREATE POLICY "Authenticated users can upload library logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'library-logos' AND auth.role() = 'authenticated');

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.categories (name, slug) VALUES
  ('Fiksi', 'fiksi'),
  ('Non-Fiksi', 'non-fiksi'),
  ('Sains', 'sains'),
  ('Sejarah', 'sejarah'),
  ('Bisnis', 'bisnis'),
  ('Teknologi', 'teknologi'),
  ('Sastra', 'sastra'),
  ('Kuliner', 'kuliner'),
  ('Pendidikan', 'pendidikan'),
  ('Agama', 'agama');
