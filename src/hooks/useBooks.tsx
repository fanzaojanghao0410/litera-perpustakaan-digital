import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/data/books';
import { toast } from 'sonner';

export interface BookFilters {
  search?: string;
  category?: string;
  isFree?: boolean;
  sortBy?: 'popular' | 'newest' | 'oldest' | 'rating' | 'price-low' | 'price-high';
}

export interface CreateBookData {
  title: string;
  author_name: string;
  synopsis?: string;
  cover_url?: string;
  category_id?: string;
  price?: number;
  is_free?: boolean;
  is_borrowable?: boolean;
  borrow_duration?: number;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
}

export interface UpdateBookData extends Partial<CreateBookData> {
  id: string;
}

// Helper to map DB row to Book interface
function mapBookRow(book: any): Book {
  return {
    id: book.id,
    title: book.title || '',
    author_name: book.author_name,
    cover: book.cover_url || '',
    cover_url: book.cover_url,
    synopsis: book.synopsis || '',
    category: book.categories?.name || '',
    price: book.price || 0,
    is_free: book.is_free || false,
    is_borrowable: book.is_borrowable || false,
    borrow_duration: book.borrow_duration || 7,
    status: book.status || 'draft',
    uploader_id: book.uploader_id,
    // Statistics
    total_reads: book.total_reads || 0,
    unique_readers: book.unique_readers || book.total_reads || 0,
    rating_avg: book.rating_avg || 0,
    rating_count: book.rating_count || 0,
  };
}

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*, categories(name)')
        .eq('status', 'published');

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,author_name.ilike.%${filters.search}%,synopsis.ilike.%${filters.search}%`);
      }

      if (filters?.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree);
      }

      switch (filters?.sortBy) {
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        case 'oldest': query = query.order('created_at', { ascending: true }); break;
        case 'popular': query = query.order('total_reads', { ascending: false }); break;
        case 'rating': query = query.order('rating_avg', { ascending: false }); break;
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let books = (data || []).map(mapBookRow);

      // Client-side category filter by name
      if (filters?.category) {
        books = books.filter(b => b.category === filters.category);
      }

      return books;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook untuk mengambil hanya buku milik user yang login (untuk Dashboard)
export function useUserBooks() {
  return useQuery({
    queryKey: ['user-books'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapBookRow);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Interface untuk analytics buku
export interface BookAnalytics {
  bookId: string;
  title: string;
  cover_url?: string;
  price: number;
  is_free: boolean;
  total_reads: number;
  total_purchases: number;
  total_revenue: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

// Hook untuk mengambil data analytics buku user (pembaca, pembelian, pendapatan)
export function useBookAnalytics() {
  return useQuery({
    queryKey: ['book-analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's books
      const { data: books, error: booksError } = await (supabase as any)
        .from('books')
        .select('id, title, cover_url, price, is_free, total_reads, rating_avg, rating_count, created_at')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;

      const analytics: BookAnalytics[] = await Promise.all(
        (books || []).map(async (book: any) => {
          const { count: purchaseCount } = await (supabase as any)
            .from('purchased_books')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', book.id);

          // Hitung pembaca unik dari reading_progress
          const { data: readers } = await (supabase as any)
            .from('reading_progress')
            .select('user_id')
            .eq('book_id', book.id);
          const uniqueReaders = new Set((readers || []).map((r: any) => r.user_id)).size;

          const revenue = book.is_free ? 0 : (purchaseCount || 0) * book.price;

          return {
            bookId: book.id,
            title: book.title,
            cover_url: book.cover_url,
            price: book.price,
            is_free: book.is_free,
            total_reads: uniqueReaders,
            total_purchases: purchaseCount || 0,
            total_revenue: revenue,
            rating_avg: book.rating_avg || 0,
            rating_count: book.rating_count || 0,
            created_at: book.created_at,
          };
        })
      );

      return analytics;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapBookRow(data);
    },
    enabled: !!id,
  });
}

export function useCategories(onlyBestsellers: boolean = false) {
  return useQuery({
    queryKey: ['categories', onlyBestsellers],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      const { data, error } = await query;

      if (error) throw error;
      
      let categories = (data || []).map(c => c.name) as string[];
      
      // Filter client-side by hardcoded bestseller list until migration is run
      if (onlyBestsellers) {
        const bestsellerSlugs = [
          'fiksi', 'nonfiksi', 'buku-akademik', 'buku-anak', 'komik',
          'buku-agama', 'buku-referensi', 'buku-hobi', 'buku-profesional',
          'buku-sastra', 'buku-populer', 'fantasi', 'romance', 'thriller',
          'horor', 'misteri', 'biografi', 'sejarah', 'buku-bisnis',
          'teknologi', 'self-help', 'motivasi-populer', 'kuliner', 'travel',
          'kesehatan', 'parenting', 'pendidikan', 'agama', 'spiritualitas',
          'novel', 'cerpen', 'puisi', 'manga', 'komik-humor', 'bestseller',
          'inspirasi', 'humor'
        ];
        
        // Map names to slugs for filtering
        const nameToSlug: Record<string, string> = {
          'Fiksi': 'fiksi',
          'Nonfiksi': 'nonfiksi',
          'Buku Akademik': 'buku-akademik',
          'Buku Anak': 'buku-anak',
          'Komik': 'komik',
          'Buku Agama': 'buku-agama',
          'Buku Referensi': 'buku-referensi',
          'Buku Hobi': 'buku-hobi',
          'Buku Profesional': 'buku-profesional',
          'Buku Sastra': 'buku-sastra',
          'Buku Populer': 'buku-populer',
          'Fantasi': 'fantasi',
          'Romance': 'romance',
          'Thriller': 'thriller',
          'Horor': 'horor',
          'Misteri': 'misteri',
          'Biografi': 'biografi',
          'Sejarah': 'sejarah',
          'Buku Bisnis': 'buku-bisnis',
          'Teknologi': 'teknologi',
          'Self-help': 'self-help',
          'Motivasi': 'motivasi-populer',
          'Kuliner': 'kuliner',
          'Travel': 'travel',
          'Kesehatan': 'kesehatan',
          'Parenting': 'parenting',
          'Pendidikan': 'pendidikan',
          'Agama': 'agama',
          'Spiritualitas': 'spiritualitas',
          'Novel': 'novel',
          'Cerpen': 'cerpen',
          'Puisi': 'puisi',
          'Manga': 'manga',
          'Komik humor': 'komik-humor',
          'Bestseller': 'bestseller',
          'Inspirasi': 'inspirasi',
          'Humor': 'humor'
        };
        
        categories = categories.filter(name => {
          const slug = nameToSlug[name] || name.toLowerCase().replace(/\s+/g, '-');
          return bestsellerSlugs.includes(slug);
        });
      }
      
      return categories;
    },
  });
}

export function useCategoryOptions() {
  return useQuery({
    queryKey: ['category-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBorrowBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, userId, borrowDuration }: { bookId: string; userId: string; borrowDuration?: number }) => {
      const { data, error } = await supabase
        .from('borrowings')
        .insert({
          book_id: bookId,
          user_id: userId,
          borrowed_at: new Date().toISOString(),
          due_at: new Date(Date.now() + (borrowDuration || 7) * 24 * 60 * 60 * 1000).toISOString(),
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
    },
  });
}

export function useUserBorrows(userId?: string) {
  return useQuery({
    queryKey: ['borrowings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('borrowings')
        .select('*, books(id, title, author_name, cover_url)')
        .eq('user_id', userId)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookData: CreateBookData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          author_name: bookData.author_name,
          synopsis: bookData.synopsis,
          cover_url: bookData.cover_url,
          category_id: bookData.category_id,
          price: bookData.price,
          is_free: bookData.is_free,
          can_borrow: bookData.is_borrowable,
          borrow_days: bookData.borrow_duration,
          status: bookData.status || 'published',
          uploader_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Buku berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBookData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify ownership before updating
      const { data: book, error: fetchError } = await supabase
        .from('books')
        .select('uploader_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (book?.uploader_id !== user.id) {
        throw new Error('Anda tidak memiliki izin untuk mengedit buku ini');
      }

      const { data, error } = await supabase
        .from('books')
        .update({
          title: updates.title,
          author_name: updates.author_name,
          synopsis: updates.synopsis,
          cover_url: updates.cover_url,
          category_id: updates.category_id,
          price: updates.price,
          is_free: updates.is_free,
          can_borrow: updates.is_borrowable,
          borrow_days: updates.borrow_duration,
          status: updates.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast.success('Buku berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Attempting to delete book with id:', id);

      // First check if user is the uploader
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      // Check the book's uploader_id
      const { data: book } = await supabase.from('books').select('uploader_id').eq('id', id).single();
      console.log('Book uploader_id:', book?.uploader_id);
      console.log('Is uploader:', user?.id === book?.uploader_id);

      const { error, data } = await supabase.from('books').delete().eq('id', id).select();
      console.log('Delete result:', { error, data });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      if (data && data.length === 0) {
        console.warn('Delete returned empty array - RLS policy might be blocking the delete');
        throw new Error('Anda tidak memiliki izin untuk menghapus buku ini');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Delete successful, data:', data);
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast.success('Buku berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast.error(error.message);
    },
  });
}

export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await (supabase as any)
        .from('favourites')
        .select('*, books(*, categories(name))')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((f: any) => mapBookRow(f.books));
    },
    enabled: !!userId,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, bookId }: { userId: string; bookId: string }) => {
      const { data, error } = await (supabase as any)
        .from('favourites')
        .insert({ user_id: userId, book_id: bookId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast.success('Buku ditambahkan ke favorit');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, bookId }: { userId: string; bookId: string }) => {
      const { error } = await (supabase as any)
        .from('favourites')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast.success('Buku dihapus dari favorit');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetches the user's favourite book ids ONCE and shares the result across every
 * card. Previously each BookCard fired its own `is-favorite` request, so a grid
 * of 40 books issued 40 parallel requests and re-rendered as each one resolved.
 */
export function useFavoriteIds(userId?: string) {
  return useQuery({
    queryKey: ['favorite-ids', userId],
    queryFn: async () => {
      if (!userId) return [] as string[];
      const { data, error } = await (supabase as any)
        .from('favourites')
        .select('book_id')
        .eq('user_id', userId);
      if (error) throw error;
      return ((data ?? []) as { book_id: string }[]).map((r) => r.book_id);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useIsFavorite(userId?: string, bookId?: string) {
  const { data: ids } = useFavoriteIds(userId);
  return { data: !!bookId && !!ids?.includes(bookId) };
}


// Hook to get book statistics (reader count, views)
export function useBookStatistics(bookId?: string) {
  return useQuery({
    queryKey: ['book-statistics', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Get book views count
      const { data: viewsData, error: viewsError } = await (supabase as any)
        .from('book_views')
        .select('id', { count: 'exact' })
        .eq('book_id', bookId);

      if (viewsError) throw viewsError;

      // Get unique readers count (registered users only)
      const { data: uniqueData, error: uniqueError } = await (supabase as any)
        .from('book_views')
        .select('user_id')
        .eq('book_id', bookId)
        .not('user_id', 'is', null);

      if (uniqueError) throw uniqueError;

      const uniqueReaders = new Set(uniqueData?.map((v: any) => v.user_id)).size;

      return {
        totalViews: viewsData?.length || 0,
        uniqueReaders: uniqueReaders,
        totalReads: viewsData?.length || 0,
      };
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to record a book view (when user reads a book)
export function useRecordBookView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Record the view using the database function
      const { error } = await (supabase as any).rpc('record_book_view', {
        book_uuid: bookId,
        user_uuid: user?.id || null,
      });

      if (error) throw error;

      return { success: true };
    },
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ['book-statistics', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
