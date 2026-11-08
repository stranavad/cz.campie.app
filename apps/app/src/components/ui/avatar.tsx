import { cn } from '@/lib/utils';

interface AvatarProps {
  // The name the initials come from.
  name: string;
  className?: string;
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1)] : [name.trim()];

  return letters
    .map((word) => word?.charAt(0) ?? '')
    .join('')
    .toLocaleUpperCase('cs');
}

// Initials in a circle; the name itself is shown next to it, so this is decoration.
function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[13px] font-bold text-foreground',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export { Avatar };
