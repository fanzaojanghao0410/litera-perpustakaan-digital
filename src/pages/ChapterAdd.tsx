import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText, FileDigit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useBook } from '@/hooks/useBooks';
import { useChapters } from '@/hooks/useChapters';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ChapterAdd() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book } = useBook(bookId!);
  const { createChapter, calculateWordCount } = useChapters(bookId!);

  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Calculate word count
  const wordCount = calculateWordCount(content);

  // Undo/Redo functions
  const pushToHistory = (newContent: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  // Push to history on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== history[historyIndex]) {
        pushToHistory(content);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!title.trim()) {
      toast.error('Judul bab harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      await createChapter.mutateAsync({
        book_id: bookId!,
        chapter_number: chapterNumber,
        title: title.trim(),
        content: content.trim(),
        is_free: false,
        status: 'draft',
      });

      toast.success('Bab berhasil disimpan');
      navigate(`/book/${bookId}`);
    } catch (error) {
      toast.error('Gagal menyimpan bab');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to={`/book/${bookId}`} 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-body font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Detail Buku
          </Link>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-700 border-gray-200">
              <FileText className="h-3 w-3 mr-1" /> {book.title}
            </Badge>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 md:p-8 text-white">
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
              Tambah Bab Baru
            </h1>
            <p className="font-body text-white/80">
              Buat bab baru untuk buku <span className="font-semibold">{book.title}</span>
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Chapter Number & Title */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-body text-gray-900 font-medium flex items-center gap-2">
                  Nomor Bab
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                  className="h-12 font-body border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-body text-gray-900 font-medium">
                  Judul Bab <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 font-body border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Contoh: Awal Pertemuan"
                  required
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-body text-gray-900 font-medium">
                  Isi Bab
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Undo (Ctrl+Z)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <path d="M3 7v6h6"/>
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Redo (Ctrl+Y)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <path d="M21 7v6h-6"/>
                        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
                      </svg>
                    </button>
                  </div>
                  <span className="text-sm text-gray-500 font-body flex items-center gap-1">
                    <FileDigit className="h-4 w-4" />
                    {wordCount.toLocaleString()} kata
                  </span>
                </div>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] font-body leading-relaxed border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl p-4"
                placeholder="Tulis isi bab di sini..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/book/${bookId}`)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 h-12 px-6 rounded-lg font-body font-medium"
              >
                Batal
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 px-8 ml-auto rounded-lg font-body font-semibold shadow-sm hover:shadow-md transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {status === 'published' ? 'Publikasikan Bab' : 'Simpan Draft'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h4 className="font-heading text-sm font-semibold text-gray-900 mb-2">Tips Menulis Bab:</h4>
          <ul className="text-sm text-gray-600 font-body space-y-1 list-disc list-inside">
            <li>Berikan judul yang menarik dan deskriptif</li>
            <li>Pastikan nomor bab berurutan</li>
            <li>Gunakan format paragraf yang rapi</li>
            <li>Set bab pertama sebagai gratis untuk menarik pembaca</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
