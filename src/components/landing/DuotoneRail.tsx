const FADE = 'linear-gradient(to bottom, #000 calc(100% - 80px), transparent 100%)';

export function DuotoneRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-[720px]">
      <span
        aria-hidden
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
        className="absolute bottom-2 left-2 top-[44px] w-1 rounded bg-gradient-to-b from-mark to-mark-2 sm:left-[22px]"
      />
      {children}
    </div>
  );
}
