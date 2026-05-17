import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content?: string;
  file_url?: string;
  is_free: boolean;
  status: 'draft' | 'published';
  word_count: number;
  views?: number;
  likes?: number;
  created_at: string;
  updated_at: string;
}

export function useChapters(bookId?: string) {
  const queryClient = useQueryClient();

  const { data: chapters, isLoading } = useQuery<Chapter[]>({
    queryKey: ['chapters', bookId],
    queryFn: async () => {
      if (!bookId) return [];

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      return (data || []) as Chapter[];
    },
    enabled: !!bookId,
  });

  // Calculate word count from content (strips HTML tags for accurate count)
  const calculateWordCount = (content: string): number => {
    if (!content) return 0;
    // Strip HTML tags to count only text content
    const textContent = content
      .replace(/<[^>]*>/g, ' ')  // Replace HTML tags with space
      .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
      .replace(/&lt;/g, '<')     // Decode HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    return textContent.split(/\s+/).filter(word => word.length > 0).length;
  };

  const createChapter = useMutation<Chapter, Error, Omit<Chapter, 'id' | 'created_at' | 'updated_at' | 'word_count' | 'views' | 'likes'> & { content?: string }>({
    mutationFn: async (chapter) => {
      const wordCount = chapter.content ? calculateWordCount(chapter.content) : 0;

      const { data, error } = await supabase
        .from('chapters')
        .insert({
          ...chapter,
          word_count: wordCount,
          status: chapter.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Chapter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
    },
  });

  const updateChapter = useMutation<Chapter, Error, { id: string } & Partial<Omit<Chapter, 'id' | 'created_at'>> & { content?: string }>({
    mutationFn: async ({ id, ...updates }) => {
      // Recalculate word count if content is updated
      const wordCount = updates.content ? calculateWordCount(updates.content) : undefined;
      
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      if (wordCount !== undefined) {
        updateData.word_count = wordCount;
      }
      
      const { data, error } = await supabase
        .from('chapters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Chapter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
    },
  });

  // Toggle chapter publish status
  const togglePublishChapter = useMutation<{ data: Chapter; newStatus: string }, Error, { id: string; currentStatus: string }>({
    mutationFn: async ({ id, currentStatus }) => {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';

      const { data, error } = await supabase
        .from('chapters')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Chapter, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
    },
  });

  const deleteChapter = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
    },
  });

  // Get next chapter
  const getNextChapter = (currentChapterNumber: number) => {
    return chapters?.find(c => c.chapter_number === currentChapterNumber + 1);
  };

  // Get previous chapter
  const getPrevChapter = (currentChapterNumber: number) => {
    return chapters?.find(c => c.chapter_number === currentChapterNumber - 1);
  };

  // Check if chapter is accessible (free or purchased)
  const isChapterAccessible = async (chapterId: string, bookId: string, userId?: string) => {
    const chapter = chapters?.find(c => c.id === chapterId);
    if (!chapter) return false;
    
    // If chapter is free, allow access
    if (chapter.is_free) return true;
    
    // If user has purchased the book, allow access
    if (userId) {
      const { data } = await supabase
        .from('purchased_books' as any)
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .single();
      
      if (data) return true;
    }
    
    return false;
  };

  // Get published chapters only (for readers)
  const publishedChapters = chapters?.filter(c => c.status === 'published') || [];

  // Get draft chapters only (for author)
  const draftChapters = chapters?.filter(c => c.status === 'draft') || [];

  return {
    chapters,
    publishedChapters,
    draftChapters,
    isLoading,
    createChapter,
    updateChapter,
    deleteChapter,
    togglePublishChapter,
    getNextChapter,
    getPrevChapter,
    isChapterAccessible,
    calculateWordCount,
  };
}

export function useChapter(chapterId?: string) {
  return useQuery<Chapter | null>({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) return null;

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return data as Chapter;
    },
    enabled: !!chapterId,
  });
}
