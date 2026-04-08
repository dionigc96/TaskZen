import { Tag } from '@/types';

interface TagBadgeProps {
  tag: Tag;
  className?: string;
  onRemove?: () => void;
}

export function TagBadge({ tag, className = '', onRemove }: TagBadgeProps) {
  // Simple heuristic for foreground color based on background luminance could be added,
  // but for now, we'll use white text with semi-transparent background for better blending.
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${className}`}
      style={{ 
        backgroundColor: `${tag.color}15`, // 15 is hex for ~8% opacity
        color: tag.color,
        borderColor: `${tag.color}30` // 30 is hex for ~19% opacity
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
      {tag.name}
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
