import { cn } from '@/lib/utils';

interface CampieMarkProps {
  className?: string;
}

// The platform's mark: a tent in an orange circle. Decorative; the product name is always next to it.
export function CampieMark({ className }: CampieMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-campie text-campie-foreground',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-1/2"
      >
        <path d="M3.5 21 14 3M20.5 21 10 3M2 21h20" />
      </svg>
    </span>
  );
}
