import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBook, useCategoryOptions } from '@/hooks/useBooks';
import { useChapters } from '@/hooks/useChapters';
import { uploadBookCover, uploadBookFile } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, Loader2, BookOpen, Image, FileText, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function UploadBook() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const createBook = useCreateBook();
  const { data: categoryOptions = [] } = useCategoryOptions();

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [canBorrow, setCanBorrow] = useState(true);
  const [borrowDays, setBorrowDays] = useState(7);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [useChaptersMode, setUseChaptersMode] = useState(false);
  const [chapters, setChapters] = useState<{ chapter_number: number; title: string; content: string }[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterContent, setNewChapterContent] = useState('');

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold text-foreground mb-4">Masuk untuk Upload Buku</h2>
        <p className="text-muted-foreground mb-6">Anda perlu masuk untuk mengunggah buku.</p>
        <Link to="/login"><Button className="button-success">Masuk</Button></Link>
      </div>
    );
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const addChapter = () => {
    if (!newChapterTitle.trim() || !newChapterContent.trim()) {
      toast.error('Judul dan konten chapter wajib diisi');
      return;
    }

    const chapterNumber = chapters.length + 1;
    setChapters([...chapters, { chapter_number: chapterNumber, title: newChapterTitle, content: newChapterContent }]);
    setNewChapterTitle('');
    setNewChapterContent('');
    toast.success('Chapter ditambahkan');
  };

  const removeChapter = (index: number) => {
    const updatedChapters = chapters.filter((_, i) => i !== index).map((ch, i) => ({
      ...ch,
      chapter_number: i + 1,
    }));
    setChapters(updatedChapters);
    toast.success('Chapter dihapus');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authorName) {
      toast.error('Judul dan penulis wajib diisi');
      return;
    }

    if (useChaptersMode && chapters.length === 0) {
      toast.error('Minimal satu chapter harus ditambahkan');
      return;
    }


    setUploading(true);
    try {
      let coverUrl = '';

      // Upload cover
      if (coverFile) {
        coverUrl = await uploadBookCover(user.id, coverFile);
      }

      // Create book
      const book = await createBook.mutateAsync({
        title,
        author_name: authorName,
        synopsis,
        cover_url: coverUrl || undefined,
        category_id: categoryId || undefined,
        price: isFree ? 0 : price,
        is_free: isFree,
        is_borrowable: canBorrow,
        borrow_duration: borrowDays,
        status: 'published',
      });

      // Create chapters if in chapter mode
      if (useChaptersMode && book) {
        const { createChapter } = useChapters();
        for (const chapter of chapters) {
          await createChapter.mutateAsync({
            book_id: book.id,
            chapter_number: chapter.chapter_number,
            title: chapter.title,
            content: chapter.content,
            is_free: true,
            status: 'published',
          });
        }
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengunggah buku');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Upload Buku</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bagikan karya Anda dengan pembaca di seluruh Indonesia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Upload */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" /> Cover Buku
            </CardTitle>
            <CardDescription>Upload gambar cover buku (JPG, PNG)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {coverPreview && (
                <img src={coverPreview} alt="Preview" className="h-32 w-24 rounded-full object-cover border border-white/20" />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="cursor-pointer glass-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Informasi Buku
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Buku *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Masukkan judul buku" className="glass-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Penulis *</Label>
                <Input id="author" value={authorName} onChange={e => setAuthorName(e.target.value)} required placeholder="Nama penulis" className="glass-input" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Sinopsis</Label>
              <Textarea id="synopsis" value={synopsis} onChange={e => setSynopsis(e.target.value)} rows={4} placeholder="Tulis sinopsis buku..." className="glass-input" />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="glass-input"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Harga & Peminjaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isFree">Gratis</Label>
              <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
            </div>
            {!isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="glass-input" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="canBorrow">Dapat Dipinjam</Label>
              <Switch id="canBorrow" checked={canBorrow} onCheckedChange={setCanBorrow} />
            </div>
            {canBorrow && (
              <div className="space-y-2">
                <Label htmlFor="borrowDays">Durasi Pinjam (hari)</Label>
                <Input id="borrowDays" type="number" value={borrowDays} onChange={e => setBorrowDays(Number(e.target.value))} className="glass-input" />
              </div>
            )}
          </CardContent>
        </Card>


        {/* Chapter Mode Toggle */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Mode Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="useChapters">Gunakan Mode Chapter</Label>
                <p className="text-xs text-muted-foreground mt-1">Upload buku per chapter seperti Wattpad</p>
              </div>
              <Switch id="useChapters" checked={useChaptersMode} onCheckedChange={setUseChaptersMode} />
            </div>
          </CardContent>
        </Card>

        {/* Chapter Management */}
        {useChaptersMode && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Kelola Chapter
              </CardTitle>
              <CardDescription>Tambahkan chapter untuk buku Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Chapter */}
              <div className="space-y-3 p-4 border border-white/20 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="chapterTitle">Judul Chapter</Label>
                  <Input
                    id="chapterTitle"
                    value={newChapterTitle}
                    onChange={e => setNewChapterTitle(e.target.value)}
                    placeholder="Contoh: Bab 1: Awal Cerita"
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapterContent">Konten Chapter</Label>
                  <Textarea
                    id="chapterContent"
                    value={newChapterContent}
                    onChange={e => setNewChapterContent(e.target.value)}
                    rows={6}
                    placeholder="Tulis konten chapter di sini..."
                    className="glass-input"
                  />
                </div>
                <Button onClick={addChapter} className="apple-button w-full gap-2">
                  <Plus className="h-4 w-4" /> Tambah Chapter
                </Button>
              </div>

              {/* Chapter List */}
              {chapters.length > 0 && (
                <div className="space-y-2">
                  <Label>Chapter yang Ditambahkan ({chapters.length})</Label>
                  {chapters.map((chapter, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Bab {chapter.chapter_number}: {chapter.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {chapter.content.substring(0, 100)}...
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeChapter(index)}
                        className="shrink-0 glass-button-outline text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" onClick={() => navigate(-1)} className="button-gray">Batal</Button>
          <Button type="submit" disabled={uploading} className="button-success">
            {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Upload className="h-4 w-4 mr-2" />
            Upload Buku
          </Button>
        </div>
      </form>
    </div>
  );
}
