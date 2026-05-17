import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBook } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { usePurchaseBook } from '@/hooks/usePurchaseBook';
import { useBorrowBook } from '@/hooks/useBorrowBook';
import { useChapters, useChapter } from '@/hooks/useChapters';
import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

export default function ReadChapter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: book, isLoading: bookLoading } = useBook(id);
  const { user } = useAuth();
  const { checkPurchased } = usePurchaseBook();
  const { checkBorrowed, getBorrowingInfo } = useBorrowBook();
  const { chapters, isLoading: chaptersLoading } = useChapters(id);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [borrowingInfo, setBorrowingInfo] = useState<any>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const checkAccess = async () => {
      const purchased = await checkPurchased(id);
      const borrowed = await checkBorrowed(id);
      const borrowInfo = await getBorrowingInfo(id);

      setIsPurchased(purchased);
      setIsBorrowed(borrowed);
      setBorrowingInfo(borrowInfo);
    };

    checkAccess();
  }, [user, id, checkPurchased, checkBorrowed, getBorrowingInfo]);

  const currentChapter = chapters?.[currentChapterIndex];
  const hasNextChapter = currentChapterIndex < (chapters?.length || 0) - 1;
  const hasPrevChapter = currentChapterIndex > 0;

  const handleNextChapter = () => {
    if (hasNextChapter) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevChapter = () => {
    if (hasPrevChapter) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
  };

  if (bookLoading || chaptersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Buku tidak ditemukan</h2>
          <Button onClick={() => navigate('/catalog')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Akses Diperlukan</h2>
          <p className="text-muted-foreground mb-6">Anda harus login untuk membaca buku ini.</p>
          <Button onClick={() => navigate('/login')} className="gap-2">
            Login Sekarang
          </Button>
        </div>
      </div>
    );
  }

  if (!isPurchased && !isBorrowed && !(book as any).is_free) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Akses Diperlukan</h2>
          <p className="text-muted-foreground mb-6">
            Anda belum memiliki akses untuk membaca buku ini. Silakan beli atau pinjam buku terlebih dahulu.
          </p>
          <Button onClick={() => navigate(`/book/${book.id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Detail
          </Button>
        </div>
      </div>
    );
  }

  if (!(book as any).has_chapters || !chapters || chapters.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">Belum Ada Chapter</h2>
          <p className="text-muted-foreground mb-6">Buku ini belum memiliki chapter.</p>
          <Button onClick={() => navigate(`/book/${book.id}`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Detail
          </Button>
        </div>
      </div>
    );
  }

  const remainingDays = borrowingInfo
    ? Math.ceil((new Date(borrowingInfo.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/book/${book.id}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-sm font-bold text-foreground truncate">{book.title}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  Bab {(currentChapter as any)?.chapter_number}: {(currentChapter as any)?.title}
                </p>
              </div>
            </div>
            <Drawer open={showChapterList} onOpenChange={setShowChapterList}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="gap-2">
                  <List className="h-5 w-5" />
                  <span className="text-sm">Daftar</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[70vh]">
                <div className="p-4">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">Daftar Chapter</h3>
                  <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                    {chapters.map((chapter: any, index) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterSelect(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          index === currentChapterIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="font-medium text-sm">Bab {chapter.chapter_number}: {chapter.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          {isBorrowed && borrowingInfo && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Akses berakhir dalam {remainingDays > 0 ? `${remainingDays} hari` : 'segera'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="glass-card p-6 md:p-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Bab {(currentChapter as any)?.chapter_number}: {(currentChapter as any)?.title}
          </h2>
          <div className="prose prose-sm md:prose-base max-w-none text-foreground leading-relaxed">
            <div className="whitespace-pre-wrap">{(currentChapter as any)?.content}</div>
          </div>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <Button
            variant="outline"
            onClick={handlePrevChapter}
            disabled={!hasPrevChapter}
            className="gap-2 flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Bab Sebelumnya
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentChapterIndex + 1} / {chapters.length}
          </div>
          <Button
            onClick={handleNextChapter}
            disabled={!hasNextChapter}
            className="gap-2 flex-1"
          >
            Bab Selanjutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
