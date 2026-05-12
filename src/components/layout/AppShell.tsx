import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { Toaster } from '@/components/ui/sonner';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6"><Outlet /></main>
      <Toaster />
    </div>
  );
}
