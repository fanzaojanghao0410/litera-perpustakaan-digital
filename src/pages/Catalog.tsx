import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Loader2,
  Plus,
  ArrowUpDown,
  Eye,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';

type SortBy =
  | 'newest'
  | 'oldest'
  | 'popular'
  | 'price-low'
  | 'price-high'
  | 'rating';

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('popular');

  const { data: books = [], isLoading: booksLoading } = useBooks({
    search: searchQuery,
    sortBy,
  });

  const { user } = useAuth();

  const sortLabels: Record<SortBy, string> = {
    newest: 'Terbaru',
    oldest: 'Terlama',
    popular: 'Paling Populer',
    'price-low': 'Harga Terendah',
    'price-high': 'Harga Tertinggi',
    rating: 'Rating Tertinggi',
  };

  const totalReaders = books.reduce(
    (sum, b) => sum + (b.total_reads || 0),
    0
  );

  const mostReadBook =
    books.length > 0
      ? books.reduce(
          (max, b) =>
            (b.total_reads || 0) > (max.total_reads || 0)
              ? b
              : max,
          books[0]
        )
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-6 md:py-10 animate-fade-in">
      <div className="container mx-auto px-3 md:px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4 animate-slide-in">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#2E5077]">
            Cari Buku
          </h1>

          <p className="mt-1 text-xs md:text-sm text-[#4a7a9e]">
            Temukan judul, penulis, atau kategori favoritmu
          </p>
        </div>

        {/* Stats Overview */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-slide-in"
          style={{ animationDelay: '0.05s' }}
        >
          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#2E5077]/10">
                <BookOpen className="h-5 w-5 text-[#2E5077]" />
              </div>

              <div>
                <p className="text-xs text-[#4a7a9e]">
                  Total Buku
                </p>

                <p className="text-xl font-bold text-[#2E5077]">
                  {booksLoading ? '-' : books.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#4DA1A9]/10">
                <Eye className="h-5 w-5 text-[#4DA1A9]" />
              </div>

              <div>
                <p className="text-xs text-[#4a7a9e]">
                  Total Pembaca
                </p>

                <p className="text-xl font-bold text-[#2E5077]">
                  {booksLoading
                    ? '-'
                    : totalReaders.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm hidden md:block">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#79D7BE]/20">
                <TrendingUp className="h-5 w-5 text-[#79D7BE]" />
              </div>

              <div>
                <p className="text-xs text-[#4a7a9e]">
                  Paling Populer
                </p>

                <p className="text-lg font-bold text-[#2E5077] truncate">
                  {booksLoading || !mostReadBook
                    ? '-'
                    : `${mostReadBook.total_reads?.toLocaleString()} baca`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Controls */}
        <div
          className="mb-6 flex flex-col gap-4 animate-slide-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4DA1A9]" />

              <Input
                placeholder="Cari judul, penulis, atau sinopsis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-[#4DA1A9]/30 rounded-full focus:border-[#4DA1A9] focus:ring-[#4DA1A9]/20"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-4 gap-2 rounded-full border-[#4DA1A9]/30"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortLabels[sortBy]}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSortBy('popular')}
                  >
                    Paling Populer
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setSortBy('newest')}
                  >
                    Terbaru
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setSortBy('oldest')}
                  >
                    Terlama
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setSortBy('rating')}
                  >
                    Rating Tertinggi
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setSortBy('price-low')}
                  >
                    Harga Terendah
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setSortBy('price-high')}
                  >
                    Harga Tertinggi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Link to="/upload" className="shrink-0">
                  <Button className="apple-button h-11 px-5 gap-2 rounded-full">
                    <Plus className="h-4 w-4" />
                    Upload
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Book Grid */}
        {booksLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DA1A9]" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4DA1A9]/10">
              <Search className="h-8 w-8 text-[#4DA1A9]" />
            </div>

            <h3 className="font-heading text-lg font-semibold text-[#2E5077] mb-2">
              Buku tidak ditemukan
            </h3>

            <p className="text-sm text-[#4a7a9e] mb-4">
              Coba ubah kata kunci pencarian
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {books.map((book, index) => (
              <div
                key={book.id}
                className="animate-scale-in"
                style={{
                  animationDelay: `${Math.min(index * 0.02, 0.5)}s`,
                }}
              >
                <BookCard book={book} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}