import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, BookOpen, ArrowLeft, Share2, Loader2, Lock, ChevronRight, Plus, ListOrdered, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCard } from '@/components/BookCard';
import { useBook, useBooks, useAddFavorite, useRemoveFavorite, useIsFavorite } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { usePurchaseBook } from '@/hooks/usePurchaseBook';
import { useChapters } from '@/hooks/useChapters';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: book, isLoading: bookLoading, error } = useBook(id!);
  const { data: allBooks = [] } = useBooks();
  const { user } = useAuth();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: isFavorite } = useIsFavorite(user?.id, id);
  const { checkPurchased } = usePurchaseBook();
  const [isPurchased, setIsPurchased] = useState(false);
  const { chapters, publishedChapters, isLoading: chaptersLoading } = useChapters(id);

  useEffect(() => {
    if (user && id) {
      checkPurchased(id).then(setIsPurchased);
    }
  }, [user, id, checkPurchased]);

  const isAuthor = user?.id === book?.uploader_id;

  const canAccessChapter = (chapter: any) => {
    if (book?.is_free) return true;
    if (chapter.is_free) return true;
    if (isPurchased) return true;
    return false;
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu', {
        action: { label: 'Login', onClick: () => navigate('/login') },
      });
      return;
    }
    if (!book) return;

    try {
      const { error } = await supabase.from('purchased_books' as any).insert({
        user_id: user.id,
        book_id: book.id,
        price: book.price,
      });
      if (error) throw error;
      toast.success('Buku berhasil dibeli!');
      setIsPurchased(true);
    } catch (err) {
      toast.error('Gagal membeli buku');
      console.error(err);
    }
  };

  const handleRead = (chapterId?: string) => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu', {
        action: { label: 'Login', onClick: () => navigate('/login') },
      });
      return;
    }
    if (chapterId) {
      navigate(`/read/${book?.id}?chapter=${chapterId}`);
    } else {
      navigate(`/read/${book?.id}`);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: book?.title,
          text: `Baca "${book?.title}" oleh ${book?.author_name}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link disalin ke clipboard');
      }
    } catch {
      // User cancelled share
    }
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-body text-base">Memuat detail buku...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 text-center max-w-md rounded-2xl shadow-lg">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Buku tidak ditemukan</h2>
          <p className="text-gray-600 font-body text-sm mb-6">Maaf, buku yang Anda cari tidak tersedia.</p>
          <Link to="/catalog">
            <Button className="apple-button rounded-xl font-body font-semibold px-6">Kembali ke Katalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const relatedBooks = allBooks.filter((b) => b.category === book.category && b.id !== book.id).slice(0, 4);
  const publishedChaptersList = publishedChapters || [];

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Navigation */}
        <div className="mb-4 md:mb-6 animate-slide-in">
          <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-body font-medium">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {/* Hero Section */}
          <div className="p-4 md:p-8">
            <div className="grid gap-6 md:gap-10 md:grid-cols-[240px_1fr]">
              {/* Cover */}
              <div className="mx-auto md:mx-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="relative w-40 md:w-full max-w-[220px] mx-auto">
                  <img
                    src={book.cover || '/logo_litera.png'}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover rounded-xl shadow-lg"
                  />
                  {book.is_free && (
                    <Badge className="absolute -top-2 -left-2 bg-green-500 text-white border-0 shadow-md rounded-full px-3 py-1 font-body text-xs font-semibold">
                      Gratis
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 rounded-full font-body text-xs font-medium px-3 py-1">
                    {book.category || 'Umum'}
                  </Badge>
                  {publishedChaptersList.length > 0 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0 rounded-full font-body text-xs font-medium px-3 py-1">
                      <ListOrdered className="h-3 w-3 mr-1" /> {publishedChaptersList.length} Bab
                    </Badge>
                  )}
                </div>

                {/* Title & Author */}
                <h1 className="font-heading text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight animate-slide-in" style={{ animationDelay: '0.4s' }}>{book.title}</h1>
                <p className="text-gray-600 font-body text-base mb-5 animate-slide-in" style={{ animationDelay: '0.5s' }}>
                  oleh <span className="font-semibold text-gray-900">{book.author_name}</span>
                </p>

                {/* Price */}
                <div className="mb-5 animate-slide-in" style={{ animationDelay: '0.6s' }}>
                  <p className="font-heading text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                    {book.is_free ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      formatPrice(book.price)
                    )}
                  </p>
                </div>

                {/* Action Buttons - Modern Style */}
                <div className="flex flex-wrap gap-3 mb-6 animate-slide-in" style={{ animationDelay: '0.7s' }}>
                  {book.is_free || isPurchased ? (
                    <Button
                      className="apple-button gap-2 h-12 px-6 rounded-lg font-body font-semibold"
                      onClick={() => handleRead(publishedChaptersList[0]?.id)}
                    >
                      <BookOpen className="h-5 w-5" /> Baca Sekarang
                    </Button>
                  ) : (
                    <Button
                      className="apple-button gap-2 h-12 px-6 rounded-lg font-body font-semibold"
                      onClick={handlePurchase}
                    >
                      <Heart className="h-5 w-5" /> Beli Buku
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="glass-button-outline gap-2 h-12 px-5 rounded-lg font-body font-medium"
                    onClick={() => {
                      if (!user) return navigate('/login');
                      isFavorite
                        ? removeFavorite.mutate({ userId: user.id, bookId: book.id })
                        : addFavorite.mutate({ userId: user.id, bookId: book.id });
                    }}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    {isFavorite ? 'Tersimpan' : 'Simpan'}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="glass-button-outline h-12 w-12 rounded-lg flex-shrink-0"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>

                </div>

                {/* Synopsis - Clean Card */}
                <div className="bg-gray-50 rounded-xl p-4 md:p-5 animate-slide-in" style={{ animationDelay: '0.8s' }}>
                  <h3 className="font-heading text-base md:text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" /> Sinopsis
                  </h3>
                  <p className="text-gray-600 font-body text-sm md:text-base leading-relaxed">{book.synopsis || 'Tidak ada sinopsis.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters Section */}
          {chaptersLoading ? (
            <div className="p-8 flex items-center justify-center border-t border-gray-100 animate-scale-in" style={{ animationDelay: '0.9s' }}>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : publishedChaptersList.length > 0 ? (
            <div className="border-t border-gray-100 bg-gray-50/50 animate-slide-in" style={{ animationDelay: '0.9s' }}>
              <div className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ListOrdered className="h-5 w-5 text-blue-600" />
                    Daftar Bab
                  </h3>
                  <span className="text-sm text-gray-500 font-body font-medium">
                    {publishedChaptersList.length} bab tersedia
                  </span>
                </div>

                <div className="space-y-2">
                  {publishedChaptersList.map((chapter: any, index: number) => {
                    const isAccessible = canAccessChapter(chapter) || index === 0;

                    return (
                      <div
                        key={chapter.id}
                        onClick={() => isAccessible && handleRead(chapter.id)}
                        className={`group flex items-center gap-3 p-3 md:p-4 rounded-xl transition-all cursor-pointer animate-scale-in ${
                          isAccessible
                            ? 'bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200 shadow-sm'
                            : 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-60'
                        }`}
                        style={{ animationDelay: `${1.0 + index * 0.05}s` }}
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-heading font-bold text-sm md:text-base ${
                          isAccessible ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {chapter.chapter_number}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-body font-medium text-sm md:text-base truncate ${
                            isAccessible ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {chapter.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {chapter.word_count > 0 && (
                              <span className="text-xs text-gray-500 font-body flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {chapter.word_count.toLocaleString()} kata
                              </span>
                            )}
                            {chapter.is_free && (
                              <Badge className="text-xs bg-green-100 text-green-700 border-0 rounded-full font-body font-medium px-2">Gratis</Badge>
                            )}
                            {!isAccessible && index !== 0 && (
                              <Badge className="text-xs bg-amber-100 text-amber-700 border-0 flex items-center gap-1 rounded-full font-body font-medium px-2">
                                <Lock className="h-3 w-3" /> Terkunci
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-transform ${
                          isAccessible ? 'text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1' : 'text-gray-300'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Book Details - Clean Grid */}
          <div className="border-t border-gray-100 p-4 md:p-8 animate-slide-in" style={{ animationDelay: '1.1s' }}>
            <h3 className="font-heading text-base md:text-lg font-semibold text-gray-900 mb-4">Detail Buku</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 animate-scale-in" style={{ animationDelay: '1.2s' }}>
                <p className="text-xs text-gray-500 font-body font-medium mb-1">Kategori</p>
                <p className="font-body font-semibold text-gray-900 text-sm">{book.category || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 animate-scale-in" style={{ animationDelay: '1.25s' }}>
                <p className="text-xs text-gray-500 font-body font-medium mb-1">Total Bab</p>
                <p className="font-body font-semibold text-gray-900 text-sm">{chapters?.length || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 animate-scale-in" style={{ animationDelay: '1.3s' }}>
                <p className="text-xs text-gray-500 font-body font-medium mb-1">Dipublikasikan</p>
                <p className="font-body font-semibold text-gray-900 text-sm">{publishedChaptersList.length}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 animate-scale-in" style={{ animationDelay: '1.35s' }}>
                <p className="text-xs text-gray-500 font-body font-medium mb-1">Status</p>
                <p className="font-body font-semibold text-sm">{book.is_free ? (
                  <span className="text-green-600">Gratis</span>
                ) : (
                  <span className="text-blue-600">Premium</span>
                )}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <div className="mt-8 md:mt-12 animate-slide-in" style={{ animationDelay: '1.4s' }}>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-gray-900 mb-6">Buku Terkait</h2>
            <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
              {relatedBooks.map((b, index) => (
                <div key={b.id} className="animate-scale-in" style={{ animationDelay: `${1.5 + index * 0.05}s` }}>
                  <BookCard book={b} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
