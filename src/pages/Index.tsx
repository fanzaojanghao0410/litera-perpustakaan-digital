import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, PenLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BookCarousel } from '@/components/BookCarousel';
import { HomeHero } from '@/components/HomeHero';
import { EmptyState } from '@/components/ui/states';
import { useHomeFeed, useContinueReading } from '@/hooks/useHome';
import { useAuth } from '@/hooks/useAuth';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Index() {
  const { user } = useAuth();
  const { data: feed, isLoading } = useHomeFeed();
  const { data: continueReading = [] } = useContinueReading(user?.id);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Pembaca';

  return (
    <div className="pb-8">
      {/* Bar sambutan + pencarian — compact, langsung ke konten */}
      <section className="border-b border-border/60 bg-card/60 px-4 py-4 md:px-6 md:py-5">
        <div className="container mx-auto max-w-7xl px-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{greeting}</p>
              <h1 className="truncate font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {user ? displayName : 'Mau baca apa hari ini?'}
              </h1>
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" className="h-10 gap-2 rounded-full px-4 text-sm transition-transform active:scale-[0.97]">
                    <PenLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Karya saya</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/catalog"
            className="mt-3 flex h-11 items-center gap-2.5 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40"
          >
            <Search className="h-4 w-4" aria-hidden />
            Cari judul, penulis, atau genre...
          </Link>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-0 pt-4 md:pt-6">
        {/* Hero karya unggulan */}
        <div className="mb-7 md:mb-9">
          <HomeHero books={feed?.trending?.length ? feed.trending : feed?.recommended ?? []} isLoading={isLoading} />
        </div>

        {/* Lanjutkan membaca */}
        {continueReading.length > 0 && (
          <section className="mb-7 md:mb-9">
            <h2 className="mb-2.5 px-4 font-heading text-base font-bold tracking-tight text-foreground md:px-6 md:text-lg">
              Lanjutkan Membaca
            </h2>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 pb-1 pl-4 md:scroll-px-6 md:pl-6">
              {continueReading.map(({ book, percent }) => (
                <Link
                  key={book.id}
                  to={`/read/${book.id}`}
                  className="flex w-[240px] shrink-0 snap-start gap-3 rounded-xl border border-border bg-card p-2.5 transition-shadow hover:shadow-md"
                >
                  <img
                    src={book.cover || '/placeholder.png'}
                    alt={`Sampul ${book.title}`}
                    loading="lazy"
                    decoding="async"
                    className="h-[76px] w-[57px] shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">
                      {book.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{book.author_name}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{percent}% selesai</p>
                  </div>
                </Link>
              ))}
              <div aria-hidden className="w-1 shrink-0 md:w-3" />
            </div>
          </section>
        )}

        <BookCarousel
          title="Rekomendasi Untukmu"
          subtitle="Dipilih dari koleksi Litera"
          books={feed?.recommended ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        <BookCarousel
          title="Populer Bulan Ini"
          books={feed?.popularMonth ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        <BookCarousel
          title="Paling Banyak Dibaca"
          books={feed?.mostRead ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        <BookCarousel
          title="Sedang Tren"
          books={feed?.trending ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        <BookCarousel
          title="Rilisan Baru"
          books={feed?.newReleases ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        <BookCarousel
          title="Rating Tertinggi"
          books={feed?.topRated ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        {/* Genre sections */}
        {(feed?.genres ?? []).map((g) => (
          <BookCarousel
            key={g.name}
            title={g.name}
            subtitle={`${g.books.length} karya`}
            books={g.books}
            viewAllTo="/catalog"
          />
        ))}

        {/* Featured authors */}
        {(feed?.featuredAuthors?.length ?? 0) > 0 && (
          <section className="mb-7 md:mb-9">
            <h2 className="mb-2.5 px-4 font-heading text-base font-bold tracking-tight text-foreground md:px-6 md:text-lg">
              Penulis Pilihan
            </h2>
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-4 pb-1 pl-4 md:scroll-px-6 md:pl-6">
              {feed!.featuredAuthors.map((a) => (
                <div
                  key={a.name}
                  className="flex w-[160px] shrink-0 snap-start flex-col items-center rounded-xl border border-border bg-card p-3 text-center"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                    {initials(a.name)}
                  </div>
                  <p className="mt-2 line-clamp-1 text-[13px] font-semibold text-foreground">{a.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.books} karya · {a.reads.toLocaleString('id-ID')} baca
                  </p>
                </div>
              ))}
              <div aria-hidden className="w-1 shrink-0 md:w-3" />
            </div>
          </section>
        )}

        {/* Baru ditambahkan */}
        <BookCarousel
          title="Baru Ditambahkan"
          books={feed?.recentlyAdded ?? []}
          isLoading={isLoading}
          viewAllTo="/catalog"
        />

        {!isLoading && (feed?.all.length ?? 0) === 0 && (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Belum ada karya terbit"
            description="Jadilah yang pertama membagikan karyamu di Litera."
            action={
              <Link to="/dashboard">
                <Button className="apple-button rounded-full px-5">
                  Mulai menulis <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
