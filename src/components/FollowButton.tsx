import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFollowingIds, useToggleFollow } from '@/hooks/useSocial';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function FollowButton({ targetId, size = 'md', className }: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: followingIds = [] } = useFollowingIds();
  const toggle = useToggleFollow();

  if (user?.id === targetId) return null;

  const isFollowing = followingIds.includes(targetId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return navigate('/login');
        toggle.mutate({ targetId, isFollowing });
      }}
      className={cn(
        'rounded-full font-semibold transition-colors',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm',
        isFollowing
          ? 'border border-border bg-card text-foreground hover:bg-muted'
          : 'bg-primary text-primary-foreground hover:opacity-90',
        className
      )}
    >
      {isFollowing ? 'Mengikuti' : 'Ikuti'}
    </button>
  );
}
