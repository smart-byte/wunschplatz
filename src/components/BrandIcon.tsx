import { cn } from '@/lib/utils';

export function BrandIcon({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}wunschplatz-icon.png`}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={cn('shrink-0 select-none object-contain', className)}
    />
  );
}
