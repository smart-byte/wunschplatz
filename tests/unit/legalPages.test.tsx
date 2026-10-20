import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { routes } from '@/routes';
import { LandingFooter } from '@/components/landing/LandingFooter';

beforeAll(async () => {
  await i18n.changeLanguage('de');
  // Load the lazy route once, so a busy machine does not eat into each test's wait.
  await import('@/pages/legal');
});

afterEach(async () => {
  await i18n.changeLanguage('de');
});

const open = (path: string) =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);

describe('legal pages', () => {
  it('links the legal notice and privacy policy from the landing page footer', () => {
    render(
      <MemoryRouter>
        <LandingFooter />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Impressum' }).getAttribute('href')).toBe('/impressum');
    expect(screen.getByRole('link', { name: 'Datenschutz' }).getAttribute('href')).toBe(
      '/datenschutz',
    );
  });

  it('names the provider in the legal notice', async () => {
    open('/impressum');
    expect(await screen.findByRole('heading', { level: 1, name: 'Impressum' })).toBeTruthy();
    expect(screen.getAllByText(/Smart-Byte GmbH/).length).toBeGreaterThan(0);
  });

  it('lets visitors turn off counting in the privacy policy', async () => {
    open('/datenschutz');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Datenschutzerklärung' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('checkbox', { name: 'Besuche aus diesem Browser zählen' }),
    ).toBeTruthy();
  });

  it('shows the English privacy policy in the English interface', async () => {
    await i18n.changeLanguage('en');
    open('/datenschutz');
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy policy' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Count visits from this browser' })).toBeTruthy();
  });
});
