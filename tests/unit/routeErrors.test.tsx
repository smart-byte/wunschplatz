import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { PageError, RouteError, routes } from '@/routes';

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

describe('route errors', () => {
  it('shows a not-found page with a way home for unknown URLs', async () => {
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/nope'] })} />);
    expect(await screen.findByRole('heading', { name: 'Seite nicht gefunden' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zur Startseite' }).getAttribute('href')).toBe('/');
  });

  it('asks for a reload when part of the app failed to load', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        ErrorBoundary: RouteError,
        lazy: async () => {
          throw new TypeError('Failed to fetch dynamically imported module: /assets/app.js');
        },
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: 'Die App konnte nicht geladen werden' }),
    ).toBeTruthy();
  });

  it('keeps the app frame around a crashed page', async () => {
    const Crash = () => {
      throw new Error('Render failed');
    };
    const Frame = () => (
      <>
        <nav>Navigation</nav>
        <Outlet />
      </>
    );
    const router = createMemoryRouter([
      {
        path: '/',
        Component: Frame,
        children: [{ index: true, Component: Crash, ErrorBoundary: PageError }],
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeTruthy();
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('does not blame the connection when a page crashes', async () => {
    const Crash = () => {
      throw new Error('Render failed');
    };
    const router = createMemoryRouter([{ path: '/', Component: Crash, ErrorBoundary: RouteError }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zur Startseite' })).toBeTruthy();
  });
});
