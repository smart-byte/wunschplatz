import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const links = [
  { to: '/projects', label: 'Projekte' },
  { to: '/students', label: 'Schüler' },
  { to: '/optimize', label: 'Optimierung' },
  { to: '/distribution', label: 'Verteilung' },
];

export function Nav() {
  return (
    <nav className="flex gap-4 border-b bg-card px-6 py-3">
      <span className="font-semibold mr-6">Projektverteilung</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn('text-sm hover:text-foreground', isActive ? 'font-medium text-foreground' : 'text-muted-foreground')
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
