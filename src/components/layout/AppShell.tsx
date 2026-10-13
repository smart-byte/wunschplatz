import { useRoundsStore } from '@/store/useRoundsStore';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from './Nav';
import { Toaster } from '@/components/ui/sonner';
import { RoundsGate } from '@/components/RoundsGate';

export function AppShell() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const activeRoundId = useRoundsStore((s) => s.activeRoundId);
  return (
    <RoundsGate>
      <div className="relative isolate min-h-screen flex flex-col bg-paper">
        <Nav />
        <main key={activeRoundId} className="relative flex-1 min-w-0 px-4 py-8 sm:px-8 sm:py-10">
          {/* One frame for every page, aligned with the navigation. */}
          <div className="mx-auto w-full max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
        <Toaster />
      </div>
    </RoundsGate>
  );
}
