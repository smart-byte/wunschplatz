import { useTranslation } from 'react-i18next';
import {
  Link,
  Outlet,
  ScrollRestoration,
  createBrowserRouter,
  useNavigation,
  useRouteError,
  type RouteObject,
} from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import { isChunkLoadError } from '@/lib/chunkLoadError';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const loadApp = () => import('@/pages/app');

// Warm the app chunk once the browser is idle, so entering the app never waits on the network.
const prefetchApp = () => void loadApp().catch(() => {});
if ('requestIdleCallback' in window) requestIdleCallback(prefetchApp);
else setTimeout(prefetchApp, 1500);

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Root,
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <LandingPage /> },
      {
        lazy: async () => ({ Component: (await loadApp()).AppShell }),
        // Page-level boundaries keep the navigation when a page crashes.
        children: [
          {
            path: 'projects',
            lazy: async () => ({ Component: (await loadApp()).ProjectsPage }),
            ErrorBoundary: PageError,
          },
          {
            path: 'students',
            lazy: async () => ({ Component: (await loadApp()).StudentsPage }),
            ErrorBoundary: PageError,
          },
          {
            path: 'optimize',
            lazy: async () => ({ Component: (await loadApp()).OptimizePage }),
            ErrorBoundary: PageError,
          },
          {
            path: 'distribution',
            lazy: async () => ({ Component: (await loadApp()).DistributionPage }),
            ErrorBoundary: PageError,
          },
          {
            path: 'wunschrunden',
            lazy: async () => ({ Component: (await loadApp()).WunschrundenPage }),
            ErrorBoundary: PageError,
          },
        ],
      },
      {
        path: 'impressum',
        lazy: async () => ({ Component: (await import('@/pages/legal')).ImpressumPage }),
      },
      {
        path: 'datenschutz',
        lazy: async () => ({ Component: (await import('@/pages/legal')).PrivacyPage }),
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename });

function Root() {
  const { t } = useTranslation('app');
  const loading = useNavigation().state === 'loading';
  return (
    <>
      {loading && (
        <div role="progressbar" aria-label={t('gate.loading')} className="nav-progress" />
      )}
      <Outlet />
      {/* New pages open at the top; Back returns to the previous position. */}
      <ScrollRestoration />
    </>
  );
}

function RouteLoading() {
  const { t } = useTranslation('app');
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center p-6 text-sm animate-delayed-in"
    >
      {t('gate.loading')}
    </div>
  );
}
const fullPage =
  'mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center';
const linkClass = 'text-primary underline underline-offset-2 hover:text-primary/80';

function NotFound() {
  const { t } = useTranslation('app');
  return (
    <main className={fullPage}>
      <h1 className="text-xl font-semibold">{t('common.notFoundTitle')}</h1>
      <p>{t('common.notFoundDescription')}</p>
      <Link to="/" className={linkClass}>
        {t('common.toStart')}
      </Link>
    </main>
  );
}

export function RouteError() {
  return <ErrorView error={useRouteError()} />;
}

export function PageError() {
  return <ErrorView error={useRouteError()} inShell />;
}

function ErrorView({ error, inShell = false }: { error: unknown; inShell?: boolean }) {
  const { t } = useTranslation('app');
  // Only a failed download is fixed by checking the connection; anything else is a bug.
  const prefix = isChunkLoadError(error) ? 'common.loadFailed' : 'common.crash';
  const Frame = inShell ? 'div' : 'main';
  return (
    <Frame
      className={
        inShell ? 'mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center' : fullPage
      }
    >
      <h1 className="text-xl font-semibold">{t(`${prefix}Title`)}</h1>
      <p role="alert">{t(`${prefix}Description`)}</p>
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={() => window.location.reload()}
      >
        {t('gate.retry')}
      </button>
      {!inShell && (
        <Link to="/" className={linkClass}>
          {t('common.toStart')}
        </Link>
      )}
    </Frame>
  );
}
