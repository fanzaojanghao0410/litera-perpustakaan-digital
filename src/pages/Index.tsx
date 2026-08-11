import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, Loader2, ChevronRight, Search, Heart, Download, Library, Smartphone, Globe, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { useBooks, useCategories } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { data: books = [], isLoading: booksLoading } = useBooks({ sortBy: 'popular' });
  const { isLoading: categoriesLoading } = useCategories();
  const { user } = useAuth();

  const [currentGenre, setCurrentGenre] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const genres = [
    { icon: BookOpen, name: 'Fiksi Populer', gradient: 'from-[#4DA1A9]/20 to-[#79D7BE]/20', iconColor: 'text-[#4DA1A9]' },
    { icon: Globe, name: 'Edukasi', gradient: 'from-[#79D7BE]/30 to-[#4DA1A9]/20', iconColor: 'text-[#4a7a9e]' },
    { icon: Search, name: 'Teknologi', gradient: 'from-[#4DA1A9]/20 to-[#79D7BE]/30', iconColor: 'text-[#2E5077]' },
    { icon: Heart, name: 'Romansa', gradient: 'from-[#79D7BE]/20 to-[#4DA1A9]/10', iconColor: 'text-[#4DA1A9]' },
  ];

  const handleGenreChange = (direction: number) => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentGenre((prev) => (prev + direction + genres.length) % genres.length);
      setTimeout(() => setIsFlipping(false), 300);
    }, 300);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleGenreChange(1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const popularBooks = books.slice(0, 4);
  const freeBooks = books.filter((b) => b.is_free).slice(0, 4);

  if (booksLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#4DA1A9]" />
          <p className="text-[#4a7a9e]">Memuat data...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Library, title: 'Koleksi Lengkap', desc: 'Ribuan buku dari berbagai kategori' },
    { icon: Download, title: 'Download & Baca Offline', desc: 'Simpan buku untuk dibaca tanpa internet' },
    { icon: Heart, title: 'Favorit & Koleksi', desc: 'Simpan buku favorit dalam daftar pribadi' },
    { icon: Smartphone, title: 'Akses Multi Device', desc: 'Baca di laptop, tablet, atau smartphone' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Hero Section - Improved Design */}
      <section className="relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20" />
        <div className="relative container mx-auto px-4 max-w-7xl py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4DA1A9]/10 border border-[#4DA1A9]/20 backdrop-blur-sm animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <span className="text-sm font-semibold text-[#2E5077]">Platform Perpustakaan Digital</span>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-[#2E5077] animate-slide-in" style={{ animationDelay: '0.2s' }}>
                Jelajahi Dunia Pengetahuan
              </h1>
              <p className="text-xl text-[#4a7a9e] leading-relaxed max-w-xl animate-slide-in" style={{ animationDelay: '0.3s' }}>
                Akses ribuan buku digital dari mana saja, kapan saja. Baca, pinjam, dan koleksi buku favorit Anda dalam satu platform modern.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-in" style={{ animationDelay: '0.4s' }}>
                <Link to="/catalog">
                  <Button className="apple-button h-14 px-10 text-white font-semibold text-base rounded-xl">
                    Jelajahi Katalog <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="glass-button-outline h-14 px-10 font-semibold text-base rounded-xl">
                    Daftar Gratis
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4 animate-slide-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-[#4DA1A9]/20 border-2 border-white flex items-center justify-center animate-scale-in" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                      <span className="text-xs font-medium text-[#2E5077]">U{i}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-[#4a7a9e]">
                  <span className="font-semibold text-[#2E5077]">50.000+</span> pembaca aktif
                </div>
              </div>
            </div>
            <div className="relative animate-scale-in" style={{ animationDelay: '0.7s' }}>
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#79D7BE]/30 rounded-full blur-3xl opacity-60 animate-pulse-slow" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#4DA1A9]/20 rounded-full blur-3xl opacity-60 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
              <div className="relative flex items-center justify-center pt-20">
                <div
                  className="relative cursor-pointer perspective-1000"
                  onClick={() => handleGenreChange(1)}
                >
                  <div
                    className={`relative transform transition-all duration-700 ease-in-out ${
                      isFlipping ? 'rotate-y-180 scale-95' : 'rotate-y-0 scale-100'
                    } floating`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-[#2E5077]/20 border border-[#4DA1A9]/20 relative">
                      <div className={`aspect-[3/4] w-64 bg-gradient-to-br ${genres[currentGenre].gradient} rounded-xl flex items-center justify-center transition-all duration-700 ease-in-out relative overflow-hidden shadow-inner`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                        {(() => {
                          const Icon = genres[currentGenre].icon;
                          return <Icon className={`h-24 w-24 ${genres[currentGenre].iconColor} transition-all duration-700 ease-in-out drop-shadow-2xl`} />;
                        })()}
                      </div>
                      <p className="mt-6 text-xl font-bold text-[#2E5077] text-center transition-all duration-700 ease-in-out">
                        {genres[currentGenre].name}
                      </p>
                      <div className="flex justify-center gap-2 mt-6">
                        {genres.map((_, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenreChange(index - currentGenre);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                              index === currentGenre ? 'w-8 bg-[#4DA1A9]' : 'w-2 bg-[#4DA1A9]/30 hover:bg-[#4DA1A9]/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div
                      className="absolute bottom-0 left-1/2 w-48 h-4 bg-[#2E5077]/30 rounded-full blur-2xl transition-all duration-700 ease-in-out"
                      style={{
                        animation: 'bookShadow 4s ease-in-out infinite',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-[#2E5077] animate-slide-in">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white">5+</p>
              <p className="text-sm text-[#79D7BE] mt-1">Buku Digital</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white">1+</p>
              <p className="text-sm text-[#79D7BE] mt-1">Pengguna Aktif</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white">100+</p>
              <p className="text-sm text-[#79D7BE] mt-1">Kategori</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white">5.9</p>
              <p className="text-sm text-[#79D7BE] mt-1">Rating Pengguna</p>
            </div>
          </div>
        </div>
      </section>


      {/* Popular Books Section */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Koleksi Terbaik</span>
              <h2 className="mt-1.5 font-heading text-2xl font-bold text-foreground md:text-3xl">Buku Terpopuler</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pilihan terbaik yang paling diminati pembaca</p>
            </div>
            <Link to="/catalog" className="hidden md:block">
              <Button variant="outline" className="h-11 rounded-full px-5 font-medium">
                Lihat Semua <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {booksLoading ? (
            <BookGridSkeleton count={7} />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {popularBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          <div className="mt-6 text-center md:hidden">
            <Link to="/catalog">
              <Button variant="outline" className="h-11 rounded-full px-6 font-medium">
                Lihat Semua <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Free Books Section */}
      {(booksLoading || freeBooks.length > 0) && (
        <section className="border-y border-border/60 bg-muted/40 py-14 md:py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Gratis</span>
                <h2 className="mt-1.5 font-heading text-2xl font-bold text-foreground md:text-3xl">Buku Gratis</h2>
                <p className="mt-1 text-sm text-muted-foreground">Baca tanpa biaya, tanpa batasan</p>
              </div>
              <Link to="/catalog" className="hidden md:block">
                <Button variant="outline" className="h-11 rounded-full px-5 font-medium">
                  Lihat Semua <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {booksLoading ? (
              <BookGridSkeleton count={7} />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {freeBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
