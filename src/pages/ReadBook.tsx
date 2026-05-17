import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageCircle, Bookmark, Lock, Loader2, BookOpen, Eye, Clock, List, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBook } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { usePurchaseBook } from '@/hooks/usePurchaseBook';
import { useChapters, useChapter } from '@/hooks/useChapters';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function ReadBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chapterId = searchParams.get('chapter');
  
  const { data: book, isLoading, error } = useBook(id);
  const { publishedChapters } = useChapters(id);
  const { data: currentChapter } = useChapter(chapterId || undefined);
  const { user } = useAuth();
  const { checkPurchased } = usePurchaseBook();
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showChapters, setShowChapters] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const readerChapters = publishedChapters || [];
  const currentChapterNumber = currentChapter?.chapter_number || 1;
  const totalChapters = readerChapters?.length || 0;
  const currentIndex = readerChapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? readerChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < readerChapters.length - 1 ? readerChapters[currentIndex + 1] : null;

  // Calculate reading time (strip HTML tags for accurate word count)
  const readingTime = currentChapter?.content 
    ? Math.ceil(
        currentChapter.content
          .replace(/<[^>]*>/g, ' ')  // Strip HTML tags
          .replace(/&nbsp;/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 0).length / 200
      )
    : 0;

  useEffect(() => {
    if (!user || !id) return;
    checkPurchased(id).then(setIsPurchased);
    // Catat pembaca unik untuk statistik
    import('@/integrations/supabase/client').then(({ supabase }) => {
      (supabase as any)
        .from('reading_progress')
        .upsert(
          { user_id: user.id, book_id: id, last_read_at: new Date().toISOString() },
          { onConflict: 'user_id,book_id' }
        )
        .then(() => {});
    });
  }, [user, id, checkPurchased]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const canAccessChapter = (chapter: typeof currentChapter) => {
    if (!chapter) return false;
    if (book?.is_free) return true;
    if (chapter.is_free) return true;
    if (isPurchased) return true;
    return chapter.chapter_number === 1;
  };

  const handleChapterChange = (chapterId: string) => {
    setSearchParams({ chapter: chapterId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowChapters(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#4DA1A9]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#2E5077] relative" />
          </div>
          <p className="text-gray-600 font-body text-lg font-medium">Memuat buku...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-10 rounded-3xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">Buku tidak ditemukan</h2>
          <p className="text-gray-500 mb-6">Buku yang Anda cari tidak tersedia atau telah dihapus.</p>
          <Button onClick={() => navigate('/catalog')} className="button-success gap-2 h-12 px-8">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-10 rounded-3xl text-center max-w-md">
          <div className="w-20 h-20 bg-[#4DA1A9]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-[#2E5077]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">Akses Diperlukan</h2>
          <p className="text-gray-500 mb-6">Anda harus login untuk membaca buku ini.</p>
          <Button onClick={() => navigate('/login')} className="button-success h-12 px-8">
            Login Sekarang
          </Button>
        </div>
      </div>
    );
  }

  if (!isPurchased && !book.is_free) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-10 rounded-3xl text-center max-w-md">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">Akses Diperlukan</h2>
          <p className="text-gray-500 mb-6">Anda belum memiliki akses untuk membaca buku ini.</p>
          <Button onClick={() => navigate(`/book/${book.id}`)} className="button-success h-12 px-8">
            Kembali ke Detail Buku
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gray-100 z-[60]">
        <div 
          className="h-full bg-gradient-to-r from-[#2E5077] via-[#4DA1A9] to-[#79D7BE] transition-all duration-300 ease-out rounded-r-full"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-1.5 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to={`/book/${book.id}`}>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full h-10 w-10 transition-all hover:scale-105">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
            <div className="hidden md:block min-w-0">
              <h1 className="font-heading text-sm font-semibold text-gray-900 truncate max-w-[300px]">
                {book.title}
              </h1>
              {currentChapter && (
                <p className="text-xs text-gray-500 font-medium">
                  Bab {currentChapter.chapter_number}: {currentChapter.title}
                </p>
              )}
            </div>
          </div>

          {/* Mobile: Chapter Number */}
          <div className="flex md:hidden items-center">
            {currentChapter && (
              <div className="px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-[#4DA1A9]/30 rounded-full shadow-sm">
                <span className="text-sm font-semibold text-[#2E5077]">
                  Bab {currentChapter.chapter_number}/{totalChapters}
                </span>
              </div>
            )}
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-2">
            {/* Chapter List Sheet (Mobile) */}
            <Sheet open={showChapters} onOpenChange={setShowChapters}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full h-10 w-10 lg:hidden">
                  <List className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="p-3">
                  <h2 className="font-heading font-bold text-gray-900 mb-4 text-sm flex items-center gap-2 tracking-tight">
                    <BookOpen className="h-4 w-4 text-[#4DA1A9]" />
                    Daftar Bab
                  </h2>
                  <div className="space-y-2">
                  {readerChapters.map((chapter, index) => {
                    const isActive = chapter.id === chapterId;
                    const canAccess = canAccessChapter(chapter);
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => canAccess ? handleChapterChange(chapter.id) : toast.error('Beli buku untuk membaca bab ini')}
                        disabled={!canAccess}
                        className={`w-full text-left px-4 py-3 rounded-full transition-all duration-300 ease-out group relative overflow-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-[#2E5077]/90 via-[#3d6a8a]/90 to-[#4DA1A9]/90 text-white shadow-lg shadow-[#4DA1A9]/30 ring-1 ring-white/30 backdrop-blur-md'
                            : canAccess
                              ? 'bg-white/40 hover:bg-white/60 border border-[#4DA1A9]/20 hover:border-[#4DA1A9]/40 hover:shadow-lg hover:shadow-[#4DA1A9]/10 backdrop-blur-sm'
                              : 'opacity-40 cursor-not-allowed bg-gray-100/30 border border-gray-200/30'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10" />
                        )}
                        <div className="flex items-center gap-3 relative z-10">
                          <span className={`text-sm font-heading font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                            isActive
                              ? 'bg-white/30 text-white shadow-lg ring-1 ring-white/40'
                              : 'bg-gradient-to-br from-[#4DA1A9]/20 to-[#79D7BE]/20 text-[#2E5077] group-hover:from-[#4DA1A9]/30 group-hover:to-[#79D7BE]/30 ring-1 ring-[#4DA1A9]/20'
                          }`}>{chapter.chapter_number}</span>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className={`font-medium text-xs truncate leading-relaxed ${
                              isActive
                                ? 'text-white font-semibold'
                                : 'text-gray-800 group-hover:text-[#2E5077]'
                            }`}>{chapter.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {chapter.is_free && (
                                <span className={`text-[9px] rounded-full px-2 py-0.5 font-medium tracking-wide ${
                                  isActive
                                    ? 'bg-white/25 text-white ring-1 ring-white/30'
                                    : 'bg-green-100/80 text-green-700 ring-1 ring-green-200/50'
                                }`}>Gratis</span>
                              )}
                              <span className={`text-[10px] leading-none tracking-tight ${
                                isActive ? 'text-white/90' : 'text-gray-500'
                              }`}>{chapter.word_count?.toLocaleString() || 0} kata</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Layout: 2 Column */}
      <div className="max-w-6xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Chapter List (Desktop) */}
          <aside className="hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-[#4DA1A9]/10 bg-white/30 backdrop-blur-md">
            <div className="p-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-gray-900 flex items-center gap-2 text-sm tracking-tight">
                  <BookOpen className="h-4 w-4 text-[#4DA1A9]" />
                  Daftar Bab
                </h2>
                <span className="text-[10px] font-semibold bg-white/50 text-[#2E5077] px-2.5 py-1 rounded-full border border-[#4DA1A9]/30 shadow-sm backdrop-blur-sm">
                  {currentChapterNumber}/{totalChapters}
                </span>
              </div>
              <div className="space-y-2">
                {readerChapters.map((chapter, index) => {
                  const isActive = chapter.id === chapterId;
                  const canAccess = canAccessChapter(chapter);
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => canAccess ? handleChapterChange(chapter.id) : toast.error('Beli buku untuk membaca bab ini')}
                      disabled={!canAccess}
                      className={`w-full text-left px-4 py-3 rounded-full transition-all duration-300 ease-out group relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r from-[#2E5077]/90 via-[#3d6a8a]/90 to-[#4DA1A9]/90 text-white shadow-lg shadow-[#4DA1A9]/30 ring-1 ring-white/30 backdrop-blur-md'
                          : canAccess
                            ? 'bg-white/40 hover:bg-white/60 border border-[#4DA1A9]/20 hover:border-[#4DA1A9]/40 hover:shadow-lg hover:shadow-[#4DA1A9]/10 backdrop-blur-sm'
                            : 'opacity-40 cursor-not-allowed bg-gray-100/30 border border-gray-200/30'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10" />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <span className={`text-sm font-heading font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                          isActive
                            ? 'bg-white/30 text-white shadow-lg ring-1 ring-white/40'
                            : 'bg-gradient-to-br from-[#4DA1A9]/20 to-[#79D7BE]/20 text-[#2E5077] group-hover:from-[#4DA1A9]/30 group-hover:to-[#79D7BE]/30 ring-1 ring-[#4DA1A9]/20'
                        }`}>{chapter.chapter_number}</span>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className={`font-medium text-xs truncate leading-relaxed ${
                            isActive
                              ? 'text-white font-semibold'
                              : 'text-gray-800 group-hover:text-[#2E5077]'
                          }`}>{chapter.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {chapter.is_free && (
                              <span className={`text-[9px] rounded-full px-2 py-0.5 font-medium tracking-wide ${
                                isActive
                                  ? 'bg-white/25 text-white ring-1 ring-white/30'
                                  : 'bg-green-100/80 text-green-700 ring-1 ring-green-200/50'
                              }`}>Gratis</span>
                            )}
                            <span className={`text-[10px] leading-none tracking-tight ${
                              isActive ? 'text-white/90' : 'text-gray-500'
                            }`}>{chapter.word_count?.toLocaleString() || 0} kata</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0" ref={contentRef}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16">
              {/* CSS for Rich Text Content */}
              <style>{`
                .rich-text-content,
                .rich-text-content *,
                .rich-text-content span,
                .rich-text-content div,
                .rich-text-content p {
                  font-family: 'Poppins', sans-serif !important;
                }
                .rich-text-content p {
                  margin-bottom: 0.6rem;
                }
                .rich-text-content strong,
                .rich-text-content b {
                  font-weight: 700;
                  color: #1a1a1a;
                }
                .rich-text-content em,
                .rich-text-content i {
                  font-style: italic;
                }
                .rich-text-content u {
                  text-decoration: underline;
                  text-underline-offset: 2px;
                }
                .rich-text-content s,
                .rich-text-content del,
                .rich-text-content strike {
                  text-decoration: line-through;
                }
                .rich-text-content a {
                  color: #2E5077;
                  text-decoration: underline;
                  text-underline-offset: 2px;
                }
                .rich-text-content span[style*="bold"] {
                  font-weight: 700 !important;
                }
                .rich-text-content span[style*="italic"] {
                  font-style: italic !important;
                }
                .rich-text-content span[style*="underline"] {
                  text-decoration: underline !important;
                }
                /* Mobile adjustments */
                @media (max-width: 640px) {
                  .rich-text-content p {
                    margin-bottom: 0.5rem;
                    text-align: justify;
                    hyphens: auto;
                  }
                }
              `}</style>

              {/* Chapter Header */}
              {currentChapter ? (
                <header className="mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <Badge variant="secondary" className="bg-white/60 backdrop-blur-sm text-[#2E5077] rounded-full px-4 py-1.5 font-semibold border border-[#4DA1A9]/30 shadow-sm">
                      Bab {currentChapter.chapter_number} dari {totalChapters}
                    </Badge>
                    {currentChapter.is_free && (
                      <Badge className="bg-green-50/80 backdrop-blur-sm text-green-700 rounded-full border border-green-300/50 px-4 py-1.5 font-semibold shadow-sm">
                        Gratis
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {currentChapter.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 px-3 py-1.5 rounded-full shadow-sm">
                      <Clock className="h-4 w-4 text-[#4DA1A9]" />
                      <span className="font-medium text-gray-700">{currentChapter.word_count?.toLocaleString() || 0} kata</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 px-3 py-1.5 rounded-full shadow-sm">
                      <Eye className="h-4 w-4 text-[#4DA1A9]" />
                      <span className="font-medium text-gray-700">{currentChapter.views?.toLocaleString() || 0} x dibaca</span>
                    </div>
                    {readingTime > 0 && (
                      <div className="flex items-center gap-2 bg-[#4DA1A9]/10 backdrop-blur-sm border border-[#4DA1A9]/20 px-3 py-1.5 rounded-full shadow-sm">
                        <BookOpen className="h-4 w-4 text-[#2E5077]" />
                        <span className="font-medium text-[#2E5077]">{readingTime} menit baca</span>
                      </div>
                    )}
                  </div>
                </header>
              ) : (
                <header className="mb-10 pb-8 border-b border-gray-100 text-center">
                  <img src={book.cover || '/logo_litera.png'} alt={book.title} className="w-32 h-44 object-cover rounded-lg shadow-md mx-auto mb-6" />
                  <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                  <p className="text-gray-600 text-lg">oleh {book.author_name}</p>
                </header>
              )}

              {/* Chapter Content */}
              <article className="prose prose-lg max-w-none chapter-content">
                {currentChapter?.content ? (
                  <div 
                    className="text-gray-800 font-body text-xl sm:text-2xl rich-text-content"
                    style={{ lineHeight: '1.4', letterSpacing: '0.01em' }}
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        const content = currentChapter.content;
                        // Check if content already contains HTML tags
                        const hasHtmlTags = /<[^>]+>/.test(content);
                        
                        if (hasHtmlTags) {
                          // Content is already HTML, just clean up unnecessary divs/spans
                          return content
                            .replace(/<div[^>]*>/gi, '<p>')
                            .replace(/<\/div>/gi, '</p>')
                            .replace(/<span[^>]*>(\s*)<\/span>/gi, '$1')
                            .replace(/<p><p>/gi, '<p>')
                            .replace(/<\/p><\/p>/gi, '</p>');
                        } else {
                          // Content is plain text, convert to HTML paragraphs
                          return content
                            .split('\n\n')
                            .map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br/>')}</p>` : '')
                            .join('');
                        }
                      })()
                    }}
                  />
                ) : readerChapters.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">Belum ada bab yang dipublikasikan.</p>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-[#4DA1A9]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-[#4DA1A9]" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-6">Pilih bab untuk mulai membaca.</p>
                    <Button onClick={() => handleChapterChange(readerChapters[0].id)} className="button-success rounded-full px-8 h-12">
                      Mulai Bab Pertama
                    </Button>
                  </div>
                )}
              </article>

              {/* Chapter Navigation */}
              {currentChapter && (
                <nav className="mt-16 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-6">
                    {prevChapter ? (
                      <button
                        onClick={() => handleChapterChange(prevChapter.id)}
                        className="flex items-center gap-4 text-gray-600 hover:text-gray-900 transition-all duration-300 text-left group flex-1 p-4 rounded-2xl hover:bg-gray-50"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-[#4DA1A9]/20 group-hover:to-[#4DA1A9]/10 transition-all duration-300 group-hover:scale-110">
                          <ChevronLeft className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Bab Sebelumnya</p>
                          <p className="font-medium truncate text-base">{prevChapter.title}</p>
                        </div>
                      </button>
                    ) : <div className="flex-1" />}

                    {nextChapter ? (
                      <button
                        onClick={() => canAccessChapter(nextChapter) ? handleChapterChange(nextChapter.id) : toast.error('Beli buku untuk membaca bab selanjutnya')}
                        className={`flex items-center gap-4 text-right group flex-1 justify-end p-4 rounded-2xl transition-all duration-300 ${
                          canAccessChapter(nextChapter)
                            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Bab Selanjutnya</p>
                          <p className="font-medium truncate text-base">{nextChapter.title}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          canAccessChapter(nextChapter)
                            ? 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-[#4DA1A9]/20 group-hover:to-[#4DA1A9]/10 group-hover:scale-110'
                            : 'bg-gray-100'
                        }`}>
                          <ChevronRight className="h-6 w-6" />
                        </div>
                      </button>
                    ) : <div className="flex-1" />}
                  </div>
                </nav>
              )}

              {/* Interaction Bar */}
              <div className="mt-12 py-10 border-t border-b border-gray-100 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent">
                <div className="flex items-center justify-center gap-8 md:gap-16">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 group ${
                      isLiked
                        ? 'text-rose-500'
                        : 'text-gray-400 hover:text-rose-500'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isLiked
                        ? 'bg-rose-50 scale-110'
                        : 'bg-gray-100 group-hover:bg-rose-50 group-hover:scale-110'
                    }`}>
                      <Heart className={`h-6 w-6 transition-all ${isLiked ? 'fill-current' : ''}`} />
                    </div>
                    <span className="font-medium text-sm">{isLiked ? 'Disukai' : 'Suka'}</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#4DA1A9] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#4DA1A9]/10 group-hover:scale-110 transition-all duration-300">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm">Komentar</span>
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin'); }}
                    className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#4DA1A9] transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#4DA1A9]/10 group-hover:scale-110 transition-all duration-300">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm">Bagikan</span>
                  </button>
                </div>
              </div>

              {/* Book Info Footer */}
              <div className="mt-12 text-center">
                <Link
                  to={`/book/${book.id}`}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2E5077] bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#4DA1A9]/10 hover:to-[#4DA1A9]/5 px-6 py-3 rounded-full transition-all duration-300 font-medium hover:shadow-md hover:shadow-[#4DA1A9]/10 hover:-translate-y-0.5"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Lihat Detail Buku</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
