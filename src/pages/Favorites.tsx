import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useBooks';

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { data: favoriteBooks, isLoading } = useFavorites(user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Masuk untuk Melihat Favorit</h2>
            <p className="text-gray-600 mb-6">Anda perlu masuk untuk melihat koleksi favorit Anda.</p>
            <Link to="/login"><Button className="apple-button h-10 px-6">Masuk</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Memuat koleksi favorit...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-16 animate-fade-in">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium mb-4">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
          </Link>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Koleksi Favorit</h1>
          <p className="mt-2 text-sm text-gray-600">
            {favoriteBooks?.length || 0} buku tersimpan
          </p>
        </div>

        {/* Content */}
        {favoriteBooks && favoriteBooks.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {favoriteBooks.map((book, index) => (
                <div key={book.id} className="animate-scale-in" style={{ animationDelay: `${0.2 + index * 0.05}s` }}>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md mx-auto animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Belum Ada Favorit</h2>
            <p className="text-gray-600 mb-6">Mulai simpan buku favorit Anda untuk mengaksesnya dengan mudah.</p>
            <Link to="/catalog">
              <Button className="apple-button h-10 px-6">
                Jelajahi Katalog
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
