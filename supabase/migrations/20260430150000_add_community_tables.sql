-- ============================================
-- COMMUNITY FEATURES - COMPREHENSIVE SETUP
-- ============================================
-- Migration: Add all community tables for Litera Digital Library
-- Includes: posts, comments, reactions, groups, chat, notifications, reports

-- ============================================
-- HANDLE OLD TABLES (Rename instead of drop to avoid deadlocks)
-- ============================================

-- Rename old tables to backup names if they exist (avoids DROP TABLE deadlocks)
DO $$
BEGIN
    -- Rename old chats table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chats' AND table_schema = 'public') THEN
        ALTER TABLE IF EXISTS public.chats RENAME TO chats_backup_old;
    END IF;
    
    -- Rename old messages table if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        ALTER TABLE IF EXISTS public.messages RENAME TO messages_backup_old;
    END IF;
END $$;

-- ============================================
-- ENUMS
-- ============================================

-- Group visibility enum
DO $$ BEGIN
    CREATE TYPE group_visibility AS ENUM ('public', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Group member roles enum
DO $$ BEGIN
    CREATE TYPE group_member_role AS ENUM ('owner', 'admin', 'moderator', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Group join request status
DO $$ BEGIN
    CREATE TYPE group_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Post visibility enum
DO $$ BEGIN
    CREATE TYPE post_visibility AS ENUM ('public', 'group', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'like', 'comment', 'mention', 'follow', 'group_invite', 
        'group_join_request', 'group_approved', 'message', 
        'system', 'report_update', 'admin_action'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report status enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report type enum
DO $$ BEGIN
    CREATE TYPE report_type AS ENUM ('spam', 'harassment', 'inappropriate', 'copyright', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reaction type enum
DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'insightful');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- PROFILES EXTENSION
-- ============================================

-- Add additional fields to existing profiles table
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS location VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS books_read INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS books_uploaded INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discussion_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;

-- Create index for username search (only if columns exist)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles USING gin(username gin_trgm_ops);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column username does not exist on profiles, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles USING gin(full_name gin_trgm_ops);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column full_name does not exist on profiles, skipping index';
END $$;

-- ============================================
-- COMMUNITY POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    visibility post_visibility DEFAULT 'public',
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Indexes for posts (use EXCEPTION to handle case where table/column might not exist)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_user ON public.community_posts(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on community_posts, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_group ON public.community_posts(group_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column group_id does not exist on community_posts, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_book ON public.community_posts(book_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column book_id does not exist on community_posts, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_created ON public.community_posts(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on community_posts, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.community_posts(is_pinned DESC, created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column is_pinned does not exist on community_posts, skipping index';
END $$;

-- ============================================
-- COMMUNITY POST IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMUNITY COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Indexes for comments
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_post ON public.community_comments(post_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column post_id does not exist on community_comments, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_user ON public.community_comments(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on community_comments, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.community_comments(parent_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column parent_id does not exist on community_comments, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_created ON public.community_comments(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on community_comments, skipping index';
END $$;

-- ============================================
-- COMMUNITY REACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_reactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    reaction reaction_type DEFAULT 'like',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure only one reaction per user per content
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id),
    -- Ensure either post_id or comment_id is set, not both
    CONSTRAINT check_content_type CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.community_reactions(post_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column post_id does not exist on community_reactions, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_reactions_comment ON public.community_reactions(comment_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column comment_id does not exist on community_reactions, skipping index';
END $$;

-- ============================================
-- COMMUNITY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    rules TEXT,
    category VARCHAR(100),
    cover_url TEXT,
    avatar_url TEXT,
    visibility group_visibility DEFAULT 'public',
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.community_groups(slug);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column slug does not exist on community_groups, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_groups_category ON public.community_groups(category);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column category does not exist on community_groups, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.community_groups(visibility);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column visibility does not exist on community_groups, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_groups_name ON public.community_groups USING gin(name gin_trgm_ops);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column name does not exist on community_groups, skipping index';
END $$;

-- ============================================
-- GROUP MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role group_member_role DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now(),
    notifications_enabled BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column group_id does not exist on group_members, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on group_members, skipping index';
END $$;

-- ============================================
-- GROUP JOIN REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.group_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status group_request_status DEFAULT 'pending',
    message TEXT,
    invited_by UUID REFERENCES auth.users(id),
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_group_request UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_group_requests_group ON public.group_requests(group_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column group_id does not exist on group_requests, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_group_requests_user ON public.group_requests(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on group_requests, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_group_requests_status ON public.group_requests(status);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column status does not exist on group_requests, skipping index';
END $$;

-- ============================================
-- PRIVATE CHATS (Enhanced)
-- ============================================

-- Note: Old tables were renamed to _backup_old at the start of this migration
-- New tables: private_chats (instead of chats) and messages (new schema)
-- To migrate old chat data, query from chats_backup_old and messages_backup_old

CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_user1 INTEGER DEFAULT 0,
    unread_count_user2 INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_chat_pair UNIQUE (user1_id, user2_id)
);

ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON public.private_chats(user1_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user1_id does not exist on private_chats, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON public.private_chats(user2_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user2_id does not exist on private_chats, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_private_chats_last_message ON public.private_chats(last_message_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column last_message_at does not exist on private_chats, skipping index';
END $$;

-- ============================================
-- MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.private_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column chat_id does not exist on messages, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on messages, skipping index';
END $$;

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    link_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on notifications, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Columns user_id/is_read do not exist on notifications, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on notifications, skipping index';
END $$;

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
    reported_comment_id UUID REFERENCES public.community_comments(id) ON DELETE SET NULL,
    reported_group_id UUID REFERENCES public.community_groups(id) ON DELETE SET NULL,
    type report_type NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    evidence_urls TEXT[],
    resolved_by UUID REFERENCES auth.users(id),
    resolution_note TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column reporter_id does not exist on reports, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column status does not exist on reports, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on reports, skipping index';
END $$;

-- ============================================
-- USER BLOCKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column blocker_id does not exist on user_blocks, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column blocked_id does not exist on user_blocks, skipping index';
END $$;

-- ============================================
-- USER FOLLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column follower_id does not exist on user_follows, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column following_id does not exist on user_follows, skipping index';
END $$;

-- ============================================
-- ADMIN LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column admin_id does not exist on admin_logs, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Columns target_type/target_id do not exist on admin_logs, skipping index';
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column created_at does not exist on admin_logs, skipping index';
END $$;

-- ============================================
-- BOOKMARKED TOPICS/SAVED POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_saved_post UNIQUE (user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column user_id does not exist on saved_posts, skipping index';
END $$;

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_posts_updated_at ON public.community_posts;
        CREATE TRIGGER update_posts_updated_at
            BEFORE UPDATE ON public.community_posts
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_comments' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_comments_updated_at ON public.community_comments;
        CREATE TRIGGER update_comments_updated_at
            BEFORE UPDATE ON public.community_comments
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_groups' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_groups_updated_at ON public.community_groups;
        CREATE TRIGGER update_groups_updated_at
            BEFORE UPDATE ON public.community_groups
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
        CREATE TRIGGER update_messages_updated_at
            BEFORE UPDATE ON public.messages
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Function to update group member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_groups 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_group_member_count_trigger ON public.group_members;
        CREATE TRIGGER update_group_member_count_trigger
            AFTER INSERT OR DELETE ON public.group_members
            FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();
    END IF;
END $$;

-- Function to update post comment count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_comments' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON public.community_comments;
        CREATE TRIGGER update_post_comment_count_trigger
            AFTER INSERT OR DELETE ON public.community_comments
            FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();
    END IF;
END $$;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.following_id;
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles 
        SET follower_count = follower_count - 1 
        WHERE id = OLD.following_id;
        UPDATE public.profiles 
        SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_follower_counts_trigger ON public.user_follows;
        CREATE TRIGGER update_follower_counts_trigger
            AFTER INSERT OR DELETE ON public.user_follows
            FOR EACH ROW EXECUTE FUNCTION public.update_follower_counts();
    END IF;
END $$;

-- Function to set last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.private_chats 
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        unread_count_user1 = CASE 
            WHEN sender_id != user1_id THEN unread_count_user1 + 1 
            ELSE unread_count_user1 
        END,
        unread_count_user2 = CASE 
            WHEN sender_id != user2_id THEN unread_count_user2 + 1 
            ELSE unread_count_user2 
        END
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_chat_last_message_trigger ON public.messages;
        CREATE TRIGGER update_chat_last_message_trigger
            AFTER INSERT ON public.messages
            FOR EACH ROW EXECUTE FUNCTION public.update_chat_last_message();
    END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles policies (extended)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on profiles, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on profiles, skipping policy creation';
END $$;

-- Community Posts policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.community_posts;
    CREATE POLICY "Posts are viewable by everyone" 
        ON public.community_posts FOR SELECT USING (
            visibility = 'public' OR 
            auth.uid() = user_id OR
            (visibility = 'group' AND EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_id = community_posts.group_id 
                AND user_id = auth.uid()
            ))
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_posts, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
    CREATE POLICY "Authenticated users can create posts" 
        ON public.community_posts FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_posts, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
    CREATE POLICY "Users can update own posts" 
        ON public.community_posts FOR UPDATE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_posts, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
    CREATE POLICY "Users can delete own posts" 
        ON public.community_posts FOR DELETE 
        USING (auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        ));
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_posts, skipping policy creation';
END $$;

-- Comments policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.community_comments;
    CREATE POLICY "Comments are viewable by everyone" 
        ON public.community_comments FOR SELECT USING (true);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_comments, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
    CREATE POLICY "Authenticated users can create comments" 
        ON public.community_comments FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_comments, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
    CREATE POLICY "Users can update own comments" 
        ON public.community_comments FOR UPDATE 
        USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_comments, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
    CREATE POLICY "Users can delete own comments" 
        ON public.community_comments FOR DELETE 
        USING (auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        ));
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_comments, skipping policy creation';
END $$;

-- Reactions policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.community_reactions;
    CREATE POLICY "Reactions are viewable by everyone" 
        ON public.community_reactions FOR SELECT USING (true);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_reactions, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own reactions" ON public.community_reactions;
    CREATE POLICY "Users can manage own reactions" 
        ON public.community_reactions FOR ALL 
        USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_reactions, skipping policy creation';
END $$;

-- Groups policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.community_groups;
    CREATE POLICY "Groups are viewable by everyone" 
        ON public.community_groups FOR SELECT USING (
            visibility = 'public' OR 
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_id = community_groups.id 
                AND user_id = auth.uid()
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_groups, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.community_groups;
    CREATE POLICY "Authenticated users can create groups" 
        ON public.community_groups FOR INSERT 
        WITH CHECK (auth.uid() = created_by);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_groups, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Group owners can update groups" ON public.community_groups;
    CREATE POLICY "Group owners can update groups" 
        ON public.community_groups FOR UPDATE 
        USING (created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = community_groups.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        ));
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on community_groups, skipping policy creation';
END $$;

-- Group members policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
    CREATE POLICY "Group members are viewable by group members" 
        ON public.group_members FOR SELECT USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.group_members gm
                JOIN public.community_groups g ON g.id = gm.group_id
                WHERE gm.user_id = auth.uid() 
                AND gm.group_id = group_members.group_id
            ) OR
            EXISTS (
                SELECT 1 FROM public.community_groups 
                WHERE id = group_members.group_id AND visibility = 'public'
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on group_members, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;
    CREATE POLICY "Group owners can manage members" 
        ON public.group_members FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_id = group_members.group_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on group_members, skipping policy creation';
END $$;

-- Group requests policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own requests" ON public.group_requests;
    CREATE POLICY "Users can view own requests" 
        ON public.group_requests FOR SELECT USING (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_id = group_requests.group_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on group_requests, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can create own requests" ON public.group_requests;
    CREATE POLICY "Users can create own requests" 
        ON public.group_requests FOR INSERT 
        WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on group_requests, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Group admins can update requests" ON public.group_requests;
    CREATE POLICY "Group admins can update requests" 
        ON public.group_requests FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_id = group_requests.group_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on group_requests, skipping policy creation';
END $$;

-- Private chats policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own chats" ON public.private_chats;
    CREATE POLICY "Users can view own chats" 
        ON public.private_chats FOR SELECT USING (
            user1_id = auth.uid() OR user2_id = auth.uid()
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on private_chats, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can create chats" ON public.private_chats;
    CREATE POLICY "Users can create chats" 
        ON public.private_chats FOR INSERT 
        WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on private_chats, skipping policy creation';
END $$;

-- Messages policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Chat participants can view messages" ON public.messages;
    CREATE POLICY "Chat participants can view messages" 
        ON public.messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.private_chats 
                WHERE id = messages.chat_id 
                AND (user1_id = auth.uid() OR user2_id = auth.uid())
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on messages, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Chat participants can create messages" ON public.messages;
    CREATE POLICY "Chat participants can create messages" 
        ON public.messages FOR INSERT 
        WITH CHECK (
            sender_id = auth.uid() AND
            EXISTS (
                SELECT 1 FROM public.private_chats 
                WHERE id = messages.chat_id 
                AND (user1_id = auth.uid() OR user2_id = auth.uid())
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on messages, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
    CREATE POLICY "Users can update own messages" 
        ON public.messages FOR UPDATE 
        USING (sender_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on messages, skipping policy creation';
END $$;

-- Notifications policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications" 
        ON public.notifications FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on notifications, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications" 
        ON public.notifications FOR UPDATE 
        USING (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on notifications, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
    CREATE POLICY "Users can delete own notifications" 
        ON public.notifications FOR DELETE 
        USING (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on notifications, skipping policy creation';
END $$;

-- Reports policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
    CREATE POLICY "Users can view own reports" 
        ON public.reports FOR SELECT USING (
            reporter_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on reports, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
    CREATE POLICY "Users can create reports" 
        ON public.reports FOR INSERT 
        WITH CHECK (reporter_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on reports, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
    CREATE POLICY "Admins can update reports" 
        ON public.reports FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on reports, skipping policy creation';
END $$;

-- User blocks policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
    CREATE POLICY "Users can view own blocks" 
        ON public.user_blocks FOR SELECT USING (blocker_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on user_blocks, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own blocks" ON public.user_blocks;
    CREATE POLICY "Users can manage own blocks" 
        ON public.user_blocks FOR ALL 
        USING (blocker_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on user_blocks, skipping policy creation';
END $$;

-- User follows policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "User follows are viewable by everyone" ON public.user_follows;
    CREATE POLICY "User follows are viewable by everyone" 
        ON public.user_follows FOR SELECT USING (true);
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on user_follows, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own follows" ON public.user_follows;
    CREATE POLICY "Users can manage own follows" 
        ON public.user_follows FOR ALL 
        USING (follower_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on user_follows, skipping policy creation';
END $$;

-- Saved posts policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
    CREATE POLICY "Users can view own saved posts" 
        ON public.saved_posts FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on saved_posts, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
    CREATE POLICY "Users can manage own saved posts" 
        ON public.saved_posts FOR ALL 
        USING (user_id = auth.uid());
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on saved_posts, skipping policy creation';
END $$;

-- Admin logs policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Only admins can view logs" ON public.admin_logs;
    CREATE POLICY "Only admins can view logs" 
        ON public.admin_logs FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on admin_logs, skipping policy creation';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can create logs" ON public.admin_logs;
    CREATE POLICY "Admins can create logs" 
        ON public.admin_logs FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        );
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column not found on admin_logs, skipping policy creation';
END $$;

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Add tables to realtime publication (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_comments' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_chats' AND table_schema = 'public') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.private_chats;
    END IF;
END $$;

-- ============================================
-- SEED DATA
-- ============================================

-- Create default admin user if not exists (requires manual password setup)
-- Note: This is just a placeholder - actual admin creation should be done through app

-- Insert default group categories as groups (only if users exist and groups table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_groups' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        INSERT INTO public.community_groups (name, slug, description, category, visibility, created_by)
        SELECT * FROM (VALUES 
            ('Diskusi Umum', 'diskusi-umum', 'Tempat untuk berdiskusi tentang buku dan literasi secara umum', 'general', 'public', (SELECT id FROM auth.users LIMIT 1)),
            ('Rekomendasi Buku', 'rekomendasi-buku', 'Bagikan dan temukan rekomendasi buku terbaik', 'recommendations', 'public', (SELECT id FROM auth.users LIMIT 1)),
            ('Tanya Jawab', 'tanya-jawab', 'Ajukan pertanyaan seputar buku dan perpustakaan', 'qna', 'public', (SELECT id FROM auth.users LIMIT 1))
        ) AS v(name, slug, description, category, visibility, created_by)
        WHERE NOT EXISTS (SELECT 1 FROM public.community_groups WHERE slug = v.slug);
    END IF;
END $$;

