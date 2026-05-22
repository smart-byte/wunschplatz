import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ClipboardList, FolderKanban, Sparkles, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Link = { to: string; label: string; icon: LucideIcon };

const links: Link[] = [
  { to: '/projects',     label: 'Projekte',     icon: FolderKanban },
  { to: '/students',     label: 'Schüler',      icon: Users },
  { to: '/optimize',     label: 'Optimierung',  icon: Sparkles },
  { to: '/distribution', label: 'Verteilung',   icon: ClipboardList },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center gap-2 h-14">
        <NavLink to="/" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="size-8 rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center shadow-sm">
            <ClipboardList className="size-4" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline">
            Projektverteilung
          </span>
        </NavLink>

        <ol className="flex items-center gap-1 flex-1 overflow-x-auto">
          {links.map((l, i) => {
            const Icon = l.icon;
            return (
              <li key={l.to} className="flex items-center gap-1">
                {i > 0 && (
                  <span aria-hidden className="text-muted-foreground/40 select-none mx-0.5">›</span>
                )}
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium tabular-nums',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </span>
                      <Icon className="size-4" />
                      {l.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
