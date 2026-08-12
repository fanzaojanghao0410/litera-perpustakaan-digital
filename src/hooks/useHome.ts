import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from '@/data/books';

/** Baris buku mentah -> tipe Book yang dipakai BookCard. */
function mapRow(row: any): Book {
  return {
    id: row.id,
    title: row.title || '',
    author_name: row.author_name || '',
    cover: row.cover_url || '',
    cover_url: row.cover_url,
    synopsis: row.synopsis || '',
    category: row.categories?.name || '',
    price: Number(row.price) || 0,
    is_free: !!row.is_free,
    is_borrowable: !!row.is_borrowable,
    borrow_duration: row.borrow_duration || 7,
    status: row.status || 'draft',
    uploader_id: row.uploader_id,
    total_reads: row.total_reads || 0,
    unique_readers: row.total_reads || 0,
    rating_avg: Number(row.rating_avg) || 0,
    rating_count: row.rating_count || 0,
  };
}

export interface HomeFeed {
  all: Book[];
  recommended: Book[];
  popularMonth: Book[];
  mostRead: Book[];
  trending: Book[];
  newReleases: Book[];
  topRated: Book[];
  recentlyAdded: Book[];
  genres: { name: string; books: Book[] }[];
  featuredAuthors: { name: string; books: number; reads: number; cover?: string }[];
}

const MS_MONTH = 30 * 24 * 60 * 60 * 1000;

/** Satu query untuk seluruh homepage — hindari puluhan request paralel. */
export function useHomeFeed() {
  return useQuery<HomeFeed>({
    queryKey: ['home-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const all = (data || []).map(mapRow);
      const raw = data || [];

      const byReads = [...all].sort((a, b) => (b.total_reads || 0) - (a.total_reads || 0));
      const byRating = [...all]
        .filter((b) => (b.rating_avg || 0) > 0)
        .sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));

      const now = Date.now();
      const createdAt = new Map<string, number>(
        raw.map((r: any) => [r.id, new Date(r.created_at).getTime()])
      );
      const isRecent = (b: Book) => now - (createdAt.get(b.id) ?? 0) < MS_MONTH;

      const popularMonth = byReads.filter(isRecent).slice(0, 15);
      // Skor tren sederhana: pembaca dibagi umur buku (hari).
      const trending = [...all]
        .map((b) => {
          const ageDays = Math.max(1, (now - (createdAt.get(b.id) ?? now)) / 86400000);
          return { b, score: ((b.total_reads || 0) + (b.rating_count || 0) * 3) / Math.sqrt(ageDays) };
        })
        .sort((x, y) => y.score - x.score)
        .map((x) => x.b)
        .slice(0, 15);

      // Genre sections
      const genreMap = new Map<string, Book[]>();
      all.forEach((b) => {
        if (!b.category) return;
        const list = genreMap.get(b.category) || [];
        list.push(b);
        genreMap.set(b.category, list);
      });
      const genres = [...genreMap.entries()]
        .filter(([, list]) => list.length >= 2)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 4)
        .map(([name, books]) => ({ name, books: books.slice(0, 15) }));

      // Featured authors dari data buku yang ada
      const authorMap = new Map<string, { books: number; reads: number; cover?: string }>();
      all.forEach((b) => {
        if (!b.author_name) return;
        const cur = authorMap.get(b.author_name) || { books: 0, reads: 0, cover: b.cover };
        cur.books += 1;
        cur.reads += b.total_reads || 0;
        if (!cur.cover) cur.cover = b.cover;
        authorMap.set(b.author_name, cur);
      });
      const featuredAuthors = [...authorMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.reads - a.reads || b.books - a.books)
        .slice(0, 10);

      return {
        all,
        recommended: [...all].sort(() => Math.random() - 0.5).slice(0, 15),
        popularMonth: popularMonth.length ? popularMonth : byReads.slice(0, 15),
        mostRead: byReads.slice(0, 15),
        trending,
        newReleases: all.slice(0, 15),
        topRated: byRating.slice(0, 15),
        recentlyAdded: all.slice(0, 15),
        genres,
        featuredAuthors,
      };
    },
    staleTime: 3 * 60 * 1000,
  });
}

export interface ContinueReadingItem {
  book: Book;
  currentPage: number;
  totalPages: number;
  percent: number;
}

/**
 * Riwayat baca user. Tabel `reading_progress` mungkin belum ada di database
 * (menunggu migrasi) — kalau gagal, section-nya cukup disembunyikan.
 */
export function useContinueReading(userId?: string) {
  return useQuery<ContinueReadingItem[]>({
    queryKey: ['continue-reading', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reading_progress')
        .select('current_page, total_pages, book_id, books(*, categories(name))')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(12);

      if (error) return [];

      return (data || [])
        .filter((r: any) => r.books)
        .map((r: any) => {
          const total = r.total_pages || 0;
          const current = r.current_page || 0;
          return {
            book: mapRow(r.books),
            currentPage: current,
            totalPages: total,
            percent: total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0,
          };
        });
    },
  });
}
