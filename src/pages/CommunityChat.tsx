import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, Loader2, MessageCircle, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from '@/lib/utils';

type ChatRow = {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
};

type ProfileLite = {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function CommunityChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileLite[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch chats
  const loadChats = async () => {
    if (!user) return;
    setLoadingChats(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) {
      console.error(error);
      setLoadingChats(false);
      return;
    }
    const rows = (data || []) as any as ChatRow[];
    setChats(rows);
    // Load other-user profiles
    const otherIds = Array.from(
      new Set(
        rows.flatMap((c) => c.participant_ids.filter((id) => id !== user.id))
      )
    );
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name, full_name, username, avatar_url')
        .in('user_id', otherIds);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => {
        map[p.user_id] = p;
      });
      setProfiles(map);
    }
    setLoadingChats(false);
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime: refresh chat list on new message
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chats-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => loadChats()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChatId) return;
    setLoadingMessages(true);
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', activeChatId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setMessages(((data || []) as any) as MessageRow[]);
        setLoadingMessages(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
  }, [activeChatId]);

  // Realtime new messages on active chat
  useEffect(() => {
    if (!activeChatId) return;
    const channel = supabase
      .channel(`chat-${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as any as MessageRow];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatId]);

  const sendMessage = async () => {
    if (!user || !activeChatId || !draft.trim()) return;
    setSending(true);
    const content = draft.trim();
    setDraft('');
    const { error } = await supabase.from('messages').insert({
      chat_id: activeChatId,
      sender_id: user.id,
      content,
    });
    if (error) {
      toast.error('Gagal mengirim pesan');
      console.error(error);
      setDraft(content);
    } else {
      // Update chat metadata
      await supabase
        .from('chats')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', activeChatId);
    }
    setSending(false);
  };

  const searchUsers = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, full_name, username, avatar_url')
      .or(`display_name.ilike.%${term}%,full_name.ilike.%${term}%,username.ilike.%${term}%`)
      .neq('user_id', user.id)
      .limit(10);
    setSearchResults(((data || []) as any) as ProfileLite[]);
  };

  const startChatWith = async (otherUserId: string) => {
    if (!user) return;
    // Check existing
    const existing = chats.find(
      (c) => c.participant_ids.length === 2 && c.participant_ids.includes(otherUserId)
    );
    if (existing) {
      setActiveChatId(existing.id);
      setSearchOpen(false);
      return;
    }
    const { data, error } = await supabase
      .from('chats')
      .insert({ participant_ids: [user.id, otherUserId] })
      .select()
      .single();
    if (error) {
      toast.error('Gagal memulai chat');
      console.error(error);
      return;
    }
    setSearchOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    await loadChats();
    setActiveChatId((data as any).id);
  };

  const getOther = (chat: ChatRow) =>
    chat.participant_ids.find((id) => id !== user?.id) || '';

  const getProfile = (uid: string) => profiles[uid];
  const profileName = (p?: ProfileLite) =>
    p?.display_name || p?.full_name || p?.username || 'Pengguna';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4F0]">
        <div className="glass-card p-8 text-center max-w-sm">
          <h2 className="font-heading text-xl font-bold text-[#2E5077] mb-3">Masuk Diperlukan</h2>
          <p className="text-sm text-[#4a7a9e] mb-5">Silakan masuk untuk menggunakan fitur chat.</p>
          <Link to="/login"><Button className="apple-button w-full">Masuk</Button></Link>
        </div>
      </div>
    );
  }

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeOther = activeChat ? getProfile(getOther(activeChat)) : undefined;

  return (
    <div className="min-h-screen bg-[#F6F4F0]">
      <div className="sticky top-0 z-30 glass-nav border-b border-white/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-lg font-bold text-[#2E5077]">Chat Komunitas</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        {/* Chat list */}
        <aside className={`md:col-span-4 glass-card p-3 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-[#2E5077] flex-1">Percakapan</h2>
            <Button size="sm" variant="ghost" onClick={() => setSearchOpen((v) => !v)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {searchOpen && (
            <div className="mb-3 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              {searchResults.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => startChatWith(p.user_id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#4DA1A9]/10 text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#2E5077] text-white text-xs">
                      {profileName(p)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-[#2E5077] truncate">{profileName(p)}</span>
                </button>
              ))}
            </div>
          )}

          <ScrollArea className="flex-1">
            {loadingChats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#4DA1A9]" />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                Belum ada percakapan.
                <br />Klik <Plus className="w-3 h-3 inline" /> untuk memulai.
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((c) => {
                  const other = getProfile(getOther(c));
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                        activeChatId === c.id ? 'bg-[#4DA1A9]/15' : 'hover:bg-[#4DA1A9]/8'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={other?.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#2E5077] text-white text-xs">
                          {profileName(other)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2E5077] truncate">
                          {profileName(other)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {c.last_message || 'Mulai percakapan...'}
                        </p>
                      </div>
                      {c.last_message_at && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(c.last_message_at))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* Chat area */}
        <section className={`md:col-span-8 glass-card flex flex-col ${activeChatId ? 'flex' : 'hidden md:flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Pilih percakapan untuk mulai chat real-time.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/60 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActiveChatId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={activeOther?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#2E5077] text-white text-xs">
                    {profileName(activeOther)[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2E5077] truncate">
                    {profileName(activeOther)}
                  </p>
                  <p className="text-[10px] text-[#4DA1A9]">Online realtime</p>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 py-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#4DA1A9]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-12">
                    Belum ada pesan. Sapa terlebih dahulu 👋
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((m) => {
                      const mine = m.sender_id === user.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm break-words ${
                              mine
                                ? 'bg-[#2E5077] text-white rounded-br-sm'
                                : 'bg-white text-[#2E5077] border border-[#4DA1A9]/15 rounded-bl-sm'
                            }`}
                          >
                            {m.content}
                            <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="p-3 border-t border-white/60 flex items-center gap-2"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="h-10 text-sm bg-white/80"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="apple-button h-10 px-4"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
