// File ini hanya untuk type definitions
// Data sekarang diambil dari Supabase melalui hooks

export interface Book {
  id: string;
  title: string;
  author_name: string;
  cover: string;
  cover_url?: string;
  file_url?: string;
  synopsis: string;
  category: string;
  price: number;
  is_free: boolean;
  is_borrowable: boolean;
  borrow_duration: number;
  status: 'published' | 'draft' | 'pending' | 'rejected';
  uploader_id?: string;
  // Statistics
  total_reads?: number;
  unique_readers?: number;
  rating_avg?: number;
  rating_count?: number;
}
