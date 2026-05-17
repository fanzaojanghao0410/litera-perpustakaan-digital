import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook, useCategoryOptions } from '@/hooks/useBooks';
import { useChapters } from '@/hooks/useChapters';
import { uploadBookCover } from '@/integrations/supabase/storage';
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
import { PageTransition } from '@/components/PageTransition';
import { Plus, Edit, Trash2, BookOpen, Loader2, Search, Image, X, ArrowLeft, ListOrdered, FileText, Eye, EyeOff, Lock, Unlock, Library, Info, Tag, DollarSign, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BookManager() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  const { data: books = [], isLoading: booksLoading } = useBooks({
    search: searchQuery || undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });
  const { data: categoryOptions = [] } = useCategoryOptions();

  const createBookMutation = useCreateBook();
  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#4DA1A9]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#2E5077] relative" />
          </div>
          <p className="text-gray-600 font-body text-lg font-medium">Memuat...</p>
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
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">Akses Ditolak</h2>
          <p className="text-gray-500 mb-6">Silakan masuk untuk mengelola buku.</p>
          <Link to="/login"><Button className="button-success h-12 px-8">Masuk</Button></Link>
        </div>
      </div>
    );
  }

  const handleCreateBook = async (formData: FormData) => {
    try {
      await createBookMutation.mutateAsync({
        title: formData.get('title') as string,
        author_name: formData.get('author_name') as string,
        synopsis: (formData.get('synopsis') as string) || undefined,
        category_id: (formData.get('category_id') as string) || undefined,
        price: parseInt(formData.get('price') as string) || 0,
        is_free: formData.get('is_free') === 'on',
        is_borrowable: formData.get('is_borrowable') === 'on',
        borrow_duration: parseInt(formData.get('borrow_duration') as string) || 7,
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

  const handleUpdateBook = async (formData: FormData) => {
    try {
      await updateBookMutation.mutateAsync({
        id: editingBook.id,
        title: formData.get('title') as string,
        author_name: formData.get('author_name') as string,
        synopsis: formData.get('synopsis') as string,
        category_id: formData.get('category_id') as string,
        price: parseFloat(formData.get('price') as string) || 0,
        is_free: formData.get('is_free') === 'on',
        is_borrowable: formData.get('is_borrowable') === 'on',
        borrow_duration: parseInt(formData.get('borrow_duration') as string) || 7,
        status: 'published',
      });
      setEditingBook(null);
    } catch {}
  };

  const BookForm = ({ book, onSubmit, onCancel }: { book?: any; onSubmit: (d: FormData) => void; onCancel: () => void }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="space-y-6">
      {/* Basic Information */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4DA1A9]/20 to-[#4DA1A9]/10">
            <Info className="h-5 w-5 text-[#2E5077]" />
          </div>
          <h3 className="font-heading text-base font-semibold text-gray-900">Informasi Dasar</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Judul *</Label>
            <Input id="title" name="title" defaultValue={book?.title} required className="glass-input h-11 text-sm" placeholder="Masukkan judul buku" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author_name" className="text-sm font-medium text-gray-700">Penulis *</Label>
            <Input id="author_name" name="author_name" defaultValue={book?.author_name} required className="glass-input h-11 text-sm" placeholder="Nama penulis" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="synopsis" className="text-sm font-medium text-gray-700">Sinopsis</Label>
          <Textarea id="synopsis" name="synopsis" defaultValue={book?.synopsis} rows={5} className="glass-input resize-none text-sm" placeholder="Deskripsi singkat buku..." />
        </div>
      </div>

      {/* Classification */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
            <Tag className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-heading text-base font-semibold text-gray-900">Klasifikasi</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Kategori</Label>
          <Select name="category_id">
            <SelectTrigger className="glass-input h-11 text-sm"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing & Borrowing */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-heading text-base font-semibold text-gray-900">Harga & Peminjaman</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-gray-700">Harga (Rp)</Label>
            <Input id="price" name="price" type="number" defaultValue={book?.price || 0} className="glass-input h-11 text-sm" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrow_duration" className="text-sm font-medium text-gray-700">Lama Pinjam (hari)</Label>
            <Input id="borrow_duration" name="borrow_duration" type="number" defaultValue={book?.borrow_duration || 7} className="glass-input h-11 text-sm" placeholder="7" />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10">
            <Settings className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="font-heading text-base font-semibold text-gray-900">Opsi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 hover:border-[#4DA1A9]/50 hover:bg-[#4DA1A9]/5 transition-all">
            <input type="checkbox" name="is_free" defaultChecked={book?.is_free ?? true} className="w-5 h-5 accent-[#2E5077]" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 group-hover:text-[#2E5077] transition-colors">Gratis</span>
              <span className="text-xs text-gray-500">Buku dapat diakses tanpa biaya</span>
            </div>
          </label>
          <label className="flex items-center gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 hover:border-[#4DA1A9]/50 hover:bg-[#4DA1A9]/5 transition-all">
            <input type="checkbox" name="is_borrowable" defaultChecked={book?.is_borrowable ?? true} className="w-5 h-5 accent-[#2E5077]" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 group-hover:text-[#2E5077] transition-colors">Dapat Dipinjam</span>
              <span className="text-xs text-gray-500">Buku dapat dipinjam oleh pengguna</span>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
        <Button type="button" className="button-gray h-12 px-8 text-sm font-medium" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={createBookMutation.isPending || updateBookMutation.isPending} className="button-success h-12 px-8 text-sm font-medium">
          {(createBookMutation.isPending || updateBookMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {book ? 'Simpan Perubahan' : 'Tambah Buku'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">Manajemen Buku</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola koleksi perpustakaan digital</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="button-success h-12 px-6"><Plus className="h-4 w-4 mr-2" />Tambah Buku</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Tambah Buku Baru</DialogTitle>
                <DialogDescription className="text-gray-500">Masukkan informasi lengkap buku baru.</DialogDescription>
              </DialogHeader>
              <BookForm onSubmit={handleCreateBook} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Edit Buku</DialogTitle>
                <DialogDescription className="text-gray-500">Perbarui informasi buku "{editingBook?.title}".</DialogDescription>
              </DialogHeader>
              {editingBook && (
                <BookForm book={editingBook} onSubmit={handleUpdateBook} onCancel={() => setEditingBook(null)} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari judul, penulis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 glass-input rounded-full h-12" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px] glass-input h-12"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categoryOptions.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Books */}
        {booksLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-[#4DA1A9]" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-[#4DA1A9]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-[#4DA1A9]" />
            </div>
            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Belum ada buku</h3>
            <p className="text-gray-500 mb-6">Tambahkan buku pertama untuk memulai.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="button-success h-12 px-8">
              <Plus className="h-4 w-4 mr-2" />Tambah Buku
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card key={book.id} className="glass-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex gap-4 mb-4">
                    <img src={book.cover || '/logo_litera.png'} alt={book.title} className="h-20 w-16 rounded-lg object-cover shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 truncate mb-1">{book.title}</h3>
                      <p className="text-sm text-gray-500 truncate mb-2">{book.author_name}</p>
                      <Badge variant="outline" className="text-xs bg-[#4DA1A9]/10 text-[#2E5077] border-[#4DA1A9]/20">{book.category || 'Tanpa Kategori'}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="font-semibold text-gray-700">{book.is_free ? 'Gratis' : `Rp ${book.price?.toLocaleString()}`}</span>
                    <Badge variant={book.status === 'published' ? 'default' : 'secondary'} className="text-xs font-medium">
                      {book.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 button-info h-10" onClick={() => setEditingBook(book)}>
                      <Edit className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="button-destructive h-10">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900">Hapus Buku</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500">Yakin ingin menghapus "{book.title}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="button-gray">Batal</AlertDialogCancel>
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
  );
}
