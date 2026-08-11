import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ArrowUpDown, Eye, TrendingUp, BookOpen, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { BookCard } from '@/components/BookCard';
import { BookGridSkeleton, EmptyState, PageHeader } from '@/components/ui/states';
import { useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';

type SortBy = 'newest' | 'oldest' | 'popular' | 'price-low' | 'price-high' | 'rating';

const sortLabels: Record<SortBy, string> = {
  popular: 'Paling Populer',
  newest: 'Terbaru',
  oldest: 'Terlama',
  rating: 'Rating Tertinggi',
  'price-low': 'Harga Terendah',
  'price-high': 'Harga Tertinggi',
};

export default function Catalog() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('popular');

  // Debounce agar tidak memicu query di setiap ketikan
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: books = [], isLoading } = useBooks({ search: searchQuery, sortBy });
  const { user } = useAuth();

  const { totalReaders, mostRead } = useMemo(() => {
    const total = books.reduce((sum, b) => sum + (b.total_reads || 0), 0);
    const top = books.length
      ? books.reduce((max, b) => ((b.total_reads || 0) > (max.total_reads || 0) ? b : max), books[0])
      : null;
    return { totalReaders: total, mostRead: top };
  }, [books]);

  const stats = [
    { icon: BookOpen, label: 'Total Buku', value: isLoading ? '—' : books.length.toLocaleString('id-ID') },
    { icon: Eye, label: 'Total Pembaca', value: isLoading ? '—' : totalReaders.toLocaleString('id-ID') },
    {
      icon: TrendingUp,
      label: 'Paling Populer',
      value: isLoading || !mostRead ? '—' : `${(mostRead.total_reads || 0).toLocaleString('id-ID')} baca`,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <PageHeader title="Cari Buku" description="Temukan judul, penulis, atau kategori favoritmu" />

        {/* Search & kontrol — sticky agar selalu terjangkau saat scroll */}
        <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                aria-label="Cari buku"
                placeholder="Cari judul, penulis, atau sinopsis..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 rounded-full pl-10 pr-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 flex-1 gap-2 rounded-full px-4 md:flex-none">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="truncate">{sortLabels[sortBy]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(sortLabels) as SortBy[]).map((key) => (
                    <DropdownMenuItem key={key} onClick={() => setSortBy(key)}>
                      {sortLabels[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Link to="/upload" className="shrink-0">
                  <Button className="apple-button h-11 gap-2 rounded-full px-5">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {stats.map(({ icon: Icon, label, value, hideOnMobile }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 ${hideOnMobile ? 'hidden md:flex' : ''}`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-lg font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid buku */}
        {isLoading ? (
          <BookGridSkeleton />
        ) : books.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Buku tidak ditemukan"
            description={
              searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada buku yang tersedia saat ini.'
            }
            action={
              searchQuery ? (
                <Button variant="outline" className="rounded-full" onClick={() => setSearchInput('')}>
                  Hapus filter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">{books.length} buku ditemukan</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
