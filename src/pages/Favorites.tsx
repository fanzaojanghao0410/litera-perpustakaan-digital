import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { BookGridSkeleton, EmptyState, PageHeader } from '@/components/ui/states';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useBooks';

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { data: favoriteBooks, isLoading } = useFavorites(user?.id);

  const shell = (children: React.ReactNode) => (
    <div className="py-6 md:py-10">
      <div className="container mx-auto max-w-7xl px-4">{children}</div>
    </div>
  );

  if (authLoading) return shell(<BookGridSkeleton count={7} />);

  if (!user) {
    return shell(
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="Masuk untuk melihat favorit"
        description="Anda perlu masuk untuk melihat koleksi favorit Anda."
        action={
          <Link to="/login">
            <Button className="apple-button h-10 rounded-full px-6">Masuk</Button>
          </Link>
        }
      />
    );
  }

  return shell(
    <>
      <Link
        to="/catalog"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke pencarian
      </Link>

      <PageHeader
        title="Koleksi Favorit"
        description={isLoading ? 'Memuat koleksi...' : `${favoriteBooks?.length || 0} buku tersimpan`}
      />

      {isLoading ? (
        <BookGridSkeleton count={7} />
      ) : favoriteBooks && favoriteBooks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {favoriteBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Belum ada favorit"
          description="Mulai simpan buku favorit Anda untuk mengaksesnya dengan mudah."
          action={
            <Link to="/catalog">
              <Button className="apple-button h-10 rounded-full px-6">Jelajahi Buku</Button>
            </Link>
          }
        />
      )}
    </>
  );
}
