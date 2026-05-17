import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserBooks, useCreateBook, useUpdateBook, useDeleteBook, useCategoryOptions, useBookAnalytics } from '@/hooks/useBooks';
import { useChapters } from '@/hooks/useChapters';
import { uploadBookCover, uploadBookFile } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Upload, Loader2, Library, Plus, Edit, Trash2, Search, Settings, Image, FileText, X, BookOpen, User, ListOrdered, FileText as FileTextIcon, FileDigit, ArrowLeft, Maximize2, Minimize2, Save, BarChart3, Eye, EyeOff, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: books = [], isLoading: booksLoading } = useUserBooks();
  const { data: analytics = [], isLoading: analyticsLoading } = useBookAnalytics();
  const { data: categoryOptions = [] } = useCategoryOptions();

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Combined Book + Chapter Edit View
  const [viewMode, setViewMode] = useState<'list' | 'edit_book'>('list');
  const [editingBookFull, setEditingBookFull] = useState<any>(null);
  

  // Upload Book State
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const createBookMutation = useCreateBook();
  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();

  // Filter books
  const filteredBooks = books.filter((book: any) => {
    const matchesSearch = book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="bg-white rounded-2xl p-12 text-center border border-[#4DA1A9]/20 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#4DA1A9]" />
          <p className="text-[#4a7a9e]">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="bg-white rounded-2xl p-12 text-center max-w-md border border-[#4DA1A9]/20 shadow-sm">
          <div className="w-16 h-16 bg-[#4DA1A9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-[#2E5077] mb-4">Akses Ditolak</h2>
          <p className="text-[#4a7a9e] mb-6">Silakan masuk untuk mengakses dashboard.</p>
          <Link to="/login"><Button className="apple-button h-11 px-8 w-full">Masuk</Button></Link>
        </div>
      </div>
    );
  }

  // Reset upload form
  const resetUploadForm = () => {
    setTitle('');
    setAuthorName('');
    setSynopsis('');
    setCategoryId('');
    setPrice(0);
    setIsFree(true);
    setCoverFile(null);
    setCoverPreview(null);
  };

  // Book Manager Handlers
  const handleCreateBook = async (formData: FormData) => {
    try {
      await createBookMutation.mutateAsync({
        title: formData.get('title') as string,
        author_name: formData.get('author_name') as string,
        synopsis: (formData.get('synopsis') as string) || undefined,
        category_id: (formData.get('category_id') as string) || undefined,
        price: parseInt(formData.get('price') as string) || 0,
        is_free: formData.get('is_free') === 'on',
        status: 'published',
      });
      setIsCreateDialogOpen(false);
    } catch {}
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBookMutation.mutateAsync(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleUpdateBook = async (bookId: string, formData: FormData, isFreeValue: boolean) => {
    try {
      const coverFile = formData.get('cover_file') as File;
      let coverUrl = undefined;
      
      // Upload cover if provided
      if (coverFile && coverFile.size > 0 && user) {
        coverUrl = await uploadBookCover(user.id, coverFile);
      }
      
      const priceValue = parseFloat(formData.get('price') as string) || 0;
      
      await updateBookMutation.mutateAsync({
        id: bookId,
        title: formData.get('title') as string,
        author_name: formData.get('author_name') as string,
        synopsis: formData.get('synopsis') as string,
        category_id: formData.get('category_id') as string,
        price: isFreeValue ? 0 : priceValue,
        is_free: isFreeValue,
        status: 'published',
        ...(coverUrl && { cover_url: coverUrl }),
      });
      setEditingBook(null);
      toast.success('Buku berhasil diperbarui');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message || 'Gagal memperbarui buku');
    }
  };

  // Upload Book Handlers
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authorName) {
      toast.error('Judul dan penulis wajib diisi');
      return;
    }

    setUploading(true);
    try {
      let coverUrl = '';

      if (coverFile) {
        coverUrl = await uploadBookCover(user.id, coverFile);
      }

      await createBookMutation.mutateAsync({
        title,
        author_name: authorName,
        synopsis,
        cover_url: coverUrl || undefined,
        category_id: categoryId || undefined,
        price: isFree ? 0 : price,
        is_free: isFree,
        status: 'published',
      });

      toast.success('Buku berhasil diunggah');
      setTitle('');
      setAuthorName('');
      setSynopsis('');
      setCategoryId('');
      setPrice(0);
      setIsFree(true);
      setCoverFile(null);
      setCoverPreview(null);
      setShowUploadForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengunggah buku');
    } finally {
      setUploading(false);
    }
  };

  const BookForm = ({ book, onSubmit, onCancel, compact = false }: { book?: any; onSubmit: (d: FormData, isFree: boolean) => void; onCancel: () => void; compact?: boolean }) => {
    const [coverPreview, setCoverPreview] = useState<string | null>(book?.cover_url || null);
    const [isFree, setIsFree] = useState(book?.is_free ?? true);
    
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCoverPreview(URL.createObjectURL(file));
      }
    };
    
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget), isFree); }} className="space-y-5">
        <div className="space-y-5">
          {/* Cover Image Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Cover Buku
            </Label>
            <div className="flex gap-4 p-4 bg-gradient-to-br from-[#F6F4F0] to-white rounded-xl border border-[#4DA1A9]/20">
              {/* Cover Preview */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-32 sm:w-28 sm:h-36 bg-white rounded-xl border border-[#4DA1A9]/20 overflow-hidden shadow-sm">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#4a7a9e]/50 bg-[#4DA1A9]/5">
                      <BookOpen className="h-10 w-10 mb-2 opacity-40" />
                      <span className="text-[10px] font-medium">Belum ada cover</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Cover Upload */}
              <div className="flex-1 flex flex-col justify-center gap-3">
                <input
                  type="file"
                  name="cover_file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="text-xs text-[#4a7a9e] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#2E5077] file:text-white hover:file:bg-[#2E5077]/90 file:transition-colors"
                />
                <p className="text-[10px] text-[#4a7a9e]/70 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-[#4DA1A9]"></span>
                  Format: JPG, PNG, WebP. Max 5MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Book Title & Author */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Judul Buku *
              </Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={book?.title} 
                required 
                className="h-11 text-sm border-[#4DA1A9]/30 bg-white focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10 rounded-xl transition-all" 
                placeholder="Masukkan judul buku" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author_name" className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Penulis *
              </Label>
              <Input 
                id="author_name" 
                name="author_name" 
                defaultValue={book?.author_name} 
                required 
                className="h-11 text-sm border-[#4DA1A9]/30 bg-white focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10 rounded-xl transition-all" 
                placeholder="Nama penulis" 
              />
            </div>
          </div>
          {/* Synopsis */}
          <div className="space-y-2">
            <Label htmlFor="synopsis" className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Sinopsis
            </Label>
            <Textarea 
              id="synopsis" 
              name="synopsis" 
              defaultValue={book?.synopsis} 
              rows={3} 
              className="text-sm border-[#4DA1A9]/30 bg-white focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10 rounded-xl resize-none transition-all" 
              placeholder="Deskripsi singkat tentang buku..." 
            />
          </div>
          {/* Category & Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                <ListOrdered className="h-3.5 w-3.5" />
                Kategori
              </Label>
              <Select name="category_id" defaultValue={book?.category_id}>
                <SelectTrigger className="h-11 text-sm border-[#4DA1A9]/30 bg-white rounded-xl focus:ring-2 focus:ring-[#4DA1A9]/10">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categoryOptions.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Price Section with Free Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                  <span className="font-bold">Rp</span>
                  Harga
                </Label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F6F4F0] rounded-full">
                  <Switch
                    name="is_free"
                    checked={isFree}
                    onCheckedChange={setIsFree}
                    defaultChecked={book?.is_free ?? true}
                    className="data-[state=checked]:bg-green-500 scale-90"
                  />
                  <span className={`text-xs font-medium ${isFree ? 'text-green-600' : 'text-gray-600'}`}>
                    {isFree ? 'Gratis' : 'Berbayar'}
                  </span>
                </div>
              </div>
              
              {isFree ? (
                <>
                  <input type="hidden" name="price" value="0" />
                  <div className="h-11 flex items-center px-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Gratis untuk semua pengguna
                    </span>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-[#2E5077]">Rp</span>
                  </div>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    defaultValue={book?.price || 0} 
                    min={0}
                    max={1000000}
                    className="h-11 text-sm border-[#4DA1A9]/30 bg-white pl-10 pr-16 font-medium rounded-xl focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10 transition-all" 
                    placeholder="0 - 1.000.000"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="outline" className="text-[10px] bg-[#F6F4F0] text-[#4a7a9e] border-[#4DA1A9]/20 px-2 py-0.5 rounded-md font-medium">
                      IDR
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#4DA1A9]/20">
          {!compact && (
            <Button 
              type="button" 
              variant="outline" 
              className="glass-button-outline h-11 px-6 text-sm font-medium rounded-xl" 
              onClick={onCancel}
            >
              Batal
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createBookMutation.isPending || updateBookMutation.isPending} 
            className="apple-button h-11 px-6 text-sm font-medium rounded-xl"
          >
            {(createBookMutation.isPending || updateBookMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            <span className="flex items-center gap-1.5">
              {book ? (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tambah Buku
                </>
              )}
            </span>
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4F0] via-white to-[#79D7BE]/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-[#4DA1A9]/20 animate-slide-in">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#2E5077]">Dashboard</h1>
              <p className="text-[#4a7a9e] text-sm mt-1">
                Selamat datang, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <Button variant="outline" className="glass-button-outline h-9">
                  <Settings className="h-4 w-4 mr-2" /> Pengaturan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4a7a9e] mb-1">Buku Saya</p>
                  <p className="text-3xl font-bold text-[#2E5077]">{books.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#2E5077]/10">
                  <Library className="h-6 w-6 text-[#2E5077]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4a7a9e] mb-1">Buku Gratis Saya</p>
                  <p className="text-3xl font-bold text-[#2E5077]">{books.filter((b: any) => b.is_free).length}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#79D7BE]/20">
                  <BookOpen className="h-6 w-6 text-[#79D7BE]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#4DA1A9]/20 shadow-sm animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4a7a9e] mb-1">Status Akun</p>
                  <Badge variant={user.email_confirmed_at ? 'default' : 'secondary'} className="bg-[#79D7BE]/20 text-[#2E5077] hover:bg-[#79D7BE]/30">
                    {user.email_confirmed_at ? 'Terverifikasi' : 'Belum'}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-[#4DA1A9]/10">
                  <User className="h-6 w-6 text-[#4DA1A9]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section - Trade/Statistik Buku */}
        <div className="mb-8 bg-white rounded-2xl border border-[#4DA1A9]/20 shadow-sm animate-scale-in" style={{ animationDelay: '0.35s' }}>
          <div className="p-6 border-b border-[#4DA1A9]/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4DA1A9]/10">
                <BarChart3 className="h-5 w-5 text-[#4DA1A9]" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-[#2E5077]">Statistik Performa Buku</h2>
                <p className="text-sm text-[#4a7a9e]">Pantau pembacaan, pembelian, dan pendapatan karya Anda</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#4DA1A9]" />
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-8 text-[#4a7a9e]">
                <p>Belum ada data statistik. Upload buku pertama Anda untuk melihat performa.</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#F6F4F0] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#4a7a9e] text-sm mb-1">
                      <Eye className="h-4 w-4" />
                      <span>Total Pembaca</span>
                    </div>
                    <p className="text-2xl font-bold text-[#2E5077]">
                      {analytics.reduce((sum, a) => sum + a.total_reads, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#F6F4F0] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#4a7a9e] text-sm mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Total Pembelian</span>
                    </div>
                    <p className="text-2xl font-bold text-[#2E5077]">
                      {analytics.reduce((sum, a) => sum + a.total_purchases, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#F6F4F0] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#4a7a9e] text-sm mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Total Pendapatan</span>
                    </div>
                    <p className="text-2xl font-bold text-[#2E5077]">
                      Rp {analytics.reduce((sum, a) => sum + a.total_revenue, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#F6F4F0] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#4a7a9e] text-sm mb-1">
                      <Star className="h-4 w-4" />
                      <span>Rating Rata-rata</span>
                    </div>
                    <p className="text-2xl font-bold text-[#2E5077]">
                      {(analytics.reduce((sum, a) => sum + a.rating_avg, 0) / (analytics.length || 1)).toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#4DA1A9]/10">
                        <TableHead className="text-[#2E5077] font-semibold">Buku</TableHead>
                        <TableHead className="text-[#2E5077] font-semibold text-center">Pembaca</TableHead>
                        <TableHead className="text-[#2E5077] font-semibold text-center">Dibeli</TableHead>
                        <TableHead className="text-[#2E5077] font-semibold text-center">Pendapatan</TableHead>
                        <TableHead className="text-[#2E5077] font-semibold text-center">Rating</TableHead>
                        <TableHead className="text-[#2E5077] font-semibold text-right">Harga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.map((book) => (
                        <TableRow key={book.bookId} className="border-[#4DA1A9]/10 hover:bg-[#F6F4F0]/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={book.cover_url || '/logo_litera.png'}
                                alt={book.title}
                                className="h-12 w-9 rounded object-cover border border-[#4DA1A9]/20"
                              />
                              <div>
                                <p className="font-medium text-[#2E5077] line-clamp-1">{book.title}</p>
                                <p className="text-xs text-[#4a7a9e]">
                                  {new Date(book.created_at).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-[#2E5077]">{book.total_reads.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-[#2E5077]">{book.total_purchases}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${book.total_revenue > 0 ? 'text-green-600' : 'text-[#4a7a9e]'}`}>
                              Rp {book.total_revenue.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium text-[#2E5077]">{book.rating_avg.toFixed(1)}</span>
                              <span className="text-xs text-[#4a7a9e]">({book.rating_count})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={book.is_free ? 'default' : 'outline'} className={book.is_free ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                              {book.is_free ? 'Gratis' : `Rp ${book.price.toLocaleString()}`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Book Management */}
        <div className="bg-white rounded-2xl border border-[#4DA1A9]/20 shadow-sm animate-scale-in" style={{ animationDelay: '0.4s' }}>
          {/* Header with Add Button */}
          <div className="p-6 border-b border-[#4DA1A9]/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#2E5077]">Kelola Buku Saya</h2>
                <p className="text-sm text-[#4a7a9e]">Hanya Anda yang dapat melihat dan mengelola buku-buku ini</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="apple-button h-11 px-6"
                >
                  {showUploadForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {showUploadForm ? 'Tutup Form' : 'Upload Buku'}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Form (Collapsible) */}
          {showUploadForm && (
            <div className="p-6 border-b border-[#4DA1A9]/10 bg-[#F6F4F0]/50">
              <div className="max-w-3xl">
                <h3 className="font-semibold text-lg text-[#2E5077] mb-6">Form Upload Buku</h3>
                <form onSubmit={handleUploadSubmit} className="space-y-6">
                  {/* Cover Upload */}
                  <div className="space-y-2">
                    <Label className="text-[#4a7a9e]">Cover Buku</Label>
                    <div className="flex items-start gap-4">
                      {coverPreview && (
                        <img src={coverPreview} alt="Preview" className="h-32 w-24 rounded-xl object-cover shadow-sm border border-[#4DA1A9]/20" />
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="cursor-pointer h-11 border-[#4DA1A9]/30"
                        />
                        <p className="text-xs text-[#4a7a9e] mt-1">Format: JPG, PNG</p>
                      </div>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[#4a7a9e]">Judul Buku *</Label>
                      <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Masukkan judul buku" className="h-11 border-[#4DA1A9]/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-[#4a7a9e]">Penulis *</Label>
                      <Input id="author" value={authorName} onChange={e => setAuthorName(e.target.value)} required placeholder="Nama penulis" className="h-11 border-[#4DA1A9]/30" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="synopsis" className="text-[#4a7a9e]">Sinopsis</Label>
                    <Textarea id="synopsis" value={synopsis} onChange={e => setSynopsis(e.target.value)} rows={3} placeholder="Tulis sinopsis buku..." className="border-[#4DA1A9]/30" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[#4a7a9e]">Kategori</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="h-11 border-[#4DA1A9]/30"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#4a7a9e]">Harga (Rp)</Label>
                      <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} disabled={isFree} className="h-11 border-[#4DA1A9]/30" placeholder="0" />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="w-5 h-5 rounded border-[#4DA1A9]/30" />
                      <span className="text-[#4a7a9e]">Gratis</span>
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-[#4DA1A9]/20">
                    <Button type="button" variant="outline" onClick={resetUploadForm} className="glass-button-outline h-11 px-6">Reset</Button>
                    <Button type="submit" disabled={uploading} className="apple-button h-11 px-6">
                      {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Buku
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="p-6 border-b border-[#4DA1A9]/10">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4DA1A9]" />
                <Input placeholder="Cari judul, penulis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 border-slate-300 rounded-full" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px] border-[#4DA1A9]/30 h-11"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categoryOptions.map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Book List */}
          <div className="p-6">
            {/* Dialogs */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-[#2E5077]">Tambah Buku Baru</DialogTitle>
                  <DialogDescription className="text-[#4a7a9e]">Masukkan informasi lengkap buku baru.</DialogDescription>
                </DialogHeader>
                <BookForm onSubmit={handleCreateBook} onCancel={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-[#2E5077]">Edit Buku</DialogTitle>
                  <DialogDescription className="text-[#4a7a9e]">Perbarui informasi buku "{editingBook?.title}".</DialogDescription>
                </DialogHeader>
                {editingBook && (
                  <BookForm book={editingBook} onSubmit={(formData, isFreeValue) => handleUpdateBook(editingBook.id, formData, isFreeValue)} onCancel={() => setEditingBook(null)} />
                )}
              </DialogContent>
            </Dialog>

            {booksLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#4DA1A9]" />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[#4DA1A9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Library className="h-10 w-10 text-[#4DA1A9]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#2E5077] mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'Tidak ada hasil' : 'Belum ada buku Anda'}
                </h3>
                <p className="text-sm text-[#4a7a9e] mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Coba ubah kata kunci atau filter'
                    : 'Upload buku pertama Anda untuk memulai. Buku yang Anda upload hanya dapat dilihat dan dikelola oleh Anda.'}
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <Button onClick={() => setShowUploadForm(true)} className="apple-button h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" /> Upload Buku Pertama
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBooks.map((book: any) => (
                  <Card key={book.id} className="bg-white border-[#4DA1A9]/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3 mb-3">
                        <img src={book.cover || '/logo_litera.png'} alt={book.title} className="h-24 w-16 rounded-lg object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-[#2E5077] truncate">{book.title}</h3>
                          <p className="text-xs text-[#4a7a9e] truncate">{book.author_name}</p>
                          <Badge variant="outline" className="text-xs mt-2 bg-[#F6F4F0] border-[#4DA1A9]/20">{book.category || 'Tanpa Kategori'}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#4a7a9e] mb-3">
                        <span className="font-medium">{book.is_free ? 'Gratis' : `Rp ${book.price?.toLocaleString()}`}</span>
                        <Badge variant={book.status === 'published' ? 'default' : 'secondary'} className={`text-xs ${book.status === 'published' ? 'bg-[#79D7BE]/20 text-[#2E5077]' : 'bg-[#F6F4F0] text-[#4a7a9e]'}`}>
                          {book.status === 'published' ? 'Dipublikasikan' : 'Draft'}
                        </Badge>
                      </div>
                      {/* Combined Edit Button */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-9 glass-button-outline" 
                          onClick={() => {
                            setEditingBookFull(book);
                            setViewMode('edit_book');
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Kelola Buku
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="glass-button-outline h-9 w-9 p-0 text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-[#2E5077]">Hapus Buku</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#4a7a9e]">Yakin ingin menghapus "{book.title}"? Semua bab juga akan terhapus.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="glass-button-outline">Batal</AlertDialogCancel>
                              <Button onClick={() => handleDeleteBook(book.id)} className="button-destructive">Hapus</Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Combined Book + Chapter Edit View - Improved Layout */}
      {viewMode === 'edit_book' && editingBookFull && (
        <div className="fixed inset-0 z-50 bg-[#F6F4F0] overflow-y-auto">
          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 bg-white border-b border-[#4DA1A9]/20 shadow-sm">
            <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-7xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    setEditingBookFull(null);
                  }}
                  className="glass-button-outline h-9"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {editingBookFull?.cover_url ? (
                    <img
                      src={editingBookFull.cover_url}
                      alt=""
                      className="h-8 w-6 sm:h-9 sm:w-7 rounded object-cover shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-6 sm:h-9 sm:w-7 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-[#2E5077] text-xs sm:text-sm truncate">
                      {editingBookFull.title}
                    </h2>
                    <p className="text-[10px] text-[#4a7a9e] truncate hidden sm:block">
                      {editingBookFull.is_free ? 'Gratis' : 'Berbayar'} • {editingBookFull.author_name}
                    </p>
                  </div>
                </div>
                
                <Badge className={`text-[10px] sm:text-xs flex-shrink-0 ${editingBookFull.is_free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {editingBookFull.is_free ? 'Gratis' : 'Berbayar'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content - Stacked Layout */}
          <div className="container mx-auto max-w-7xl p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Left Column - Book Info */}
              <div className="space-y-4">
                <Card className="bg-white border-[#4DA1A9]/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-[#4DA1A9]/10 bg-[#4DA1A9]/5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#2E5077]">
                      <BookOpen className="h-4 w-4" /> Informasi Buku
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <BookForm 
                      book={editingBookFull} 
                      onSubmit={async (formData, isFreeValue) => {
                        await handleUpdateBook(editingBookFull.id, formData, isFreeValue);
                        setViewMode('list');
                        setEditingBookFull(null);
                      }} 
                      onCancel={() => {}}
                      compact
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Chapter Manager */}
              <div className="space-y-4">
                <Card className="bg-white border-[#4DA1A9]/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-[#4DA1A9]/10 bg-[#4DA1A9]/5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#2E5077]">
                      <ListOrdered className="h-4 w-4" /> Kelola Bab
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ChapterManager book={editingBookFull} />
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Bottom spacer for mobile scroll comfort */}
            <div className="h-20 lg:h-0"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chapter Manager Component
function ChapterManager({ book }: { book: any }) {
  const { 
    chapters, 
    publishedChapters, 
    draftChapters, 
    isLoading, 
    createChapter, 
    updateChapter, 
    deleteChapter,
    togglePublishChapter,
    calculateWordCount
  } = useChapters(book.id);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFullscreenEditor, setShowFullscreenEditor] = useState(false);
  
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterStatus, setChapterStatus] = useState<'draft' | 'published'>('draft');

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Calculate word count for preview
  const currentWordCount = calculateWordCount(chapterContent);

  // Undo/Redo functions
  const pushToHistory = (content: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(content);
      // Limit history to 50 items
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
      setChapterContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setChapterContent(history[historyIndex + 1]);
    }
  };

  // Initialize history when editing chapter
  useEffect(() => {
    if (editingChapter) {
      setHistory([editingChapter.content || '']);
      setHistoryIndex(0);
    }
  }, [editingChapter]);

  // Push to history on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chapterContent !== history[historyIndex]) {
        pushToHistory(chapterContent);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [chapterContent]);

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
  
  // Reset form when editing
  useEffect(() => {
    if (editingChapter) {
      setChapterNumber(editingChapter.chapter_number);
      setChapterTitle(editingChapter.title);
      setChapterContent(editingChapter.content || '');
      setChapterStatus(editingChapter.status || 'draft');
      setShowForm(true);
    }
  }, [editingChapter]);

  // Auto-scroll ke atas saat form chapter ditampilkan
  useEffect(() => {
    if (showForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showForm]);

  const resetForm = () => {
    setChapterNumber((chapters?.length || 0) + 1);
    setChapterTitle('');
    setChapterContent('');
    setChapterStatus('draft');
    setEditingChapter(null);
    setShowForm(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const chapterData = {
      book_id: book.id,
      chapter_number: chapterNumber,
      title: chapterTitle,
      content: chapterContent,
      is_free: false,
      status: chapterStatus,
    };
    
    if (editingChapter) {
      await updateChapter.mutateAsync({ id: editingChapter.id, ...chapterData });
      toast.success('Bab berhasil diperbarui');
    } else {
      await createChapter.mutateAsync(chapterData);
      toast.success('Bab berhasil ditambahkan');
    }
    
    resetForm();
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus bab ini?')) {
      await deleteChapter.mutateAsync(id);
      toast.success('Bab berhasil dihapus');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Chapter Stats - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#4DA1A9]/10 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-[#2E5077]">{chapters?.length || 0}</p>
          <p className="text-[10px] text-[#4a7a9e]">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-green-600">{publishedChapters?.length || 0}</p>
          <p className="text-[10px] text-green-600">Publik</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-amber-600">{draftChapters?.length || 0}</p>
          <p className="text-[10px] text-amber-600">Draft</p>
        </div>
      </div>

      {/* Chapter List - Compact */}
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="apple-button h-8 px-2 sm:px-3 text-xs sm:text-sm"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Tambah</span>
            <span className="sm:hidden">Tmbh</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#4DA1A9]" />
          </div>
        ) : (
          <div className="space-y-1">
            {chapters?.length > 0 ? (
              chapters.map((chapter: any) => (
                <div
                  key={chapter.id}
                  className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg gap-2 ${
                    chapter.status === 'published' ? 'bg-[#F6F4F0]' : 'bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#4a7a9e] w-4 sm:w-5 flex-shrink-0">
                      {chapter.chapter_number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#2E5077] text-sm leading-tight truncate">{chapter.title}</p>
                      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 flex-wrap">
                        {chapter.is_free && (
                          <Badge className="text-[10px] px-1 py-0 bg-green-100 text-green-600 whitespace-nowrap">Gratis</Badge>
                        )}
                        {!chapter.is_free && !book.is_free && (
                          <Badge className="text-[10px] px-1 py-0 bg-amber-100 text-amber-600 whitespace-nowrap">Premium</Badge>
                        )}
                        {chapter.word_count > 0 && (
                          <span className="text-[10px] text-[#4a7a9e] whitespace-nowrap">{chapter.word_count.toLocaleString()} kata</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Toggle Publish/Draft - Icon Eye */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublishChapter.mutate({ id: chapter.id, currentStatus: chapter.status })}
                      disabled={togglePublishChapter.isPending}
                      className={`h-8 w-8 p-0 rounded-lg ${
                        chapter.status === 'published'
                          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                          : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={chapter.status === 'published' ? 'Publik (klik untuk Draft)' : 'Draft (klik untuk Publikasikan)'}
                    >
                      {chapter.status === 'published' ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingChapter(chapter)}
                      className="h-8 w-8 p-0 rounded-lg glass-button-outline text-[#4a7a9e]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(chapter.id)}
                      className="h-8 w-8 p-0 rounded-lg glass-button-outline text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-[#F6F4F0] rounded-lg">
                <FileTextIcon className="h-8 w-8 text-[#4DA1A9] mx-auto mb-2" />
                <p className="text-sm text-[#4a7a9e]">
                  Belum ada bab
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add/Edit Chapter Form - Enhanced UI */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl border border-[#4DA1A9]/20 shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#2E5077] to-[#4DA1A9] text-white">
            <h4 className="font-semibold text-base flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Edit className="h-4 w-4" />
              </div>
              {editingChapter ? `Edit Bab ${editingChapter.chapter_number}` : 'Tambah Bab Baru'}
            </h4>
          </div>

          <div className="p-5 space-y-5">
            {/* Chapter Number & Title Row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 space-y-2">
                <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                  <ListOrdered className="h-3.5 w-3.5" />
                  Nomor
                </Label>
                <Input
                  type="number"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseInt(e.target.value))}
                  min={1}
                  className="h-11 text-sm border-[#4DA1A9]/30 bg-white text-center font-semibold text-[#2E5077] rounded-xl focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10"
                />
              </div>
              <div className="col-span-9 space-y-2">
                <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Judul Bab *
                </Label>
                <Input
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Masukkan judul bab..."
                  required
                  className="h-11 text-sm border-[#4DA1A9]/30 bg-white rounded-xl focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/10 transition-all"
                />
              </div>
            </div>
            
            {/* Content Editor Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-[#4a7a9e] flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen className="h-3.5 w-3.5" />
                  Konten
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
                  <span className="text-[10px] text-[#4a7a9e]/70 bg-[#F6F4F0] px-2 sm:px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
                    <span className="hidden sm:inline">Paste dari GDocs</span>
                    <span className="sm:hidden">GDocs OK</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullscreenEditor(true)}
                    className="h-8 px-2 sm:px-3 text-xs glass-button-outline bg-white rounded-lg whitespace-nowrap"
                  >
                    <Maximize2 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Mode Luas</span>
                    <span className="sm:hidden">Luas</span>
                  </Button>
                </div>
              </div>
            {/* Text Editor - Simple textarea with LTR support */}
            <Textarea
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              className="min-h-[350px] max-h-[60vh] overflow-y-auto p-4 text-sm border border-[#4DA1A9]/30 rounded-xl bg-white focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/20 font-body"
              placeholder="Tulis isi bab di sini..."
            />
          </div>
          
          {/* Status & Actions Footer */}
          <div className="pt-5 border-t border-[#4DA1A9]/10">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Word Count & Actions */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                {chapterContent && (
                  <div className="flex items-center gap-2 text-xs text-[#2E5077] bg-gradient-to-r from-[#4DA1A9]/10 to-[#79D7BE]/10 px-3 sm:px-4 py-2 rounded-xl border border-[#4DA1A9]/20">
                    <FileDigit className="h-4 w-4 text-[#4DA1A9]" />
                    <span className="font-semibold whitespace-nowrap">{currentWordCount.toLocaleString()} kata</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="h-10 sm:h-11 px-4 sm:px-5 text-sm font-medium rounded-xl glass-button-outline whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Batal</span>
                    <span className="sm:hidden">Btl</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={createChapter.isPending || updateChapter.isPending}
                    className="h-10 sm:h-11 px-4 sm:px-5 text-sm font-medium rounded-xl apple-button whitespace-nowrap"
                  >
                    {(createChapter.isPending || updateChapter.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1 sm:mr-2" />
                    )}
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      {editingChapter ? (
                        <>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">Simpan</span>
                          <span className="sm:hidden">Smpn</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Tambah</span>
                          <span className="sm:hidden">Tmbh</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      )}

      {/* Fullscreen Editor Dialog */}
      <Dialog open={showFullscreenEditor} onOpenChange={setShowFullscreenEditor}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-[#4DA1A9]/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-[#2E5077] text-lg">Edit Konten Bab</DialogTitle>
                <p className="text-sm text-[#4a7a9e]">
                  {editingChapter ? `Bab ${chapterNumber}: ${chapterTitle}` : `Bab ${chapterNumber}: ${chapterTitle || 'Baru'}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreenEditor(false)}
                className="h-8 px-3 text-xs border-[#4DA1A9] text-[#2E5077]"
              >
                <Minimize2 className="h-3 w-3 mr-1" />
                Tutup Mode Luas
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#4a7a9e]">Konten Bab</Label>
                <span className="text-xs text-gray-400">Paste dari Google Docs untuk menyalin formatting (Bold, Italic, Underline)</span>
              </div>
              <Textarea
                value={chapterContent}
                onChange={(e) => setChapterContent(e.target.value)}
                className="flex-1 overflow-y-auto p-4 text-base border border-[#4DA1A9]/30 rounded-lg bg-white focus:border-[#4DA1A9] focus:ring-2 focus:ring-[#4DA1A9]/20 font-body"
                style={{ lineHeight: '1.8', fontSize: '16px' }}
                placeholder="Tulis isi bab di sini..."
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-[#4DA1A9]/20 flex items-center justify-between">
            <div className="text-xs text-[#4a7a9e]">
              <FileDigit className="h-3 w-3 inline mr-1" />
              {currentWordCount.toLocaleString()} kata
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFullscreenEditor(false)}
                className="h-9 px-4 text-sm border-[#4DA1A9] text-[#2E5077]"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
