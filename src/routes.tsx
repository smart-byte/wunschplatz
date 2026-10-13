import { useTranslation } from 'react-i18next';
import { Outlet, createBrowserRouter, useNavigation } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const loadApp = () => import('@/pages/app');

// Warm the app chunk once the browser is idle, so entering the app never waits on the network.
const prefetchApp = () => void loadApp().catch(() => {});
if ('requestIdleCallback' in window) requestIdleCallback(prefetchApp);
else setTimeout(prefetchApp, 1500);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: Root,
      HydrateFallback: RouteLoading,
      ErrorBoundary: RouteError,
      children: [
        { index: true, element: <LandingPage /> },
        {
          lazy: async () => ({ Component: (await loadApp()).AppShell }),
          children: [
            {
              path: 'projects',
              lazy: async () => ({ Component: (await loadApp()).ProjectsPage }),
            },
            {
              path: 'students',
              lazy: async () => ({ Component: (await loadApp()).StudentsPage }),
            },
            {
              path: 'optimize',
              lazy: async () => ({ Component: (await loadApp()).OptimizePage }),
            },
            {
              path: 'distribution',
              lazy: async () => ({ Component: (await loadApp()).DistributionPage }),
            },
            {
              path: 'wunschrunden',
              lazy: async () => ({ Component: (await loadApp()).WunschrundenPage }),
            },
          ],
        },
      ],
    },
  ],
  { basename },
);

function Root() {
  const { t } = useTranslation('app');
  const loading = useNavigation().state === 'loading';
  return (
    <>
      {loading && <div role="progressbar" aria-label={t('gate.loading')} className="nav-progress" />}
      <Outlet />
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
function RouteError() {
  const { t } = useTranslation('app');
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('common.loadFailedTitle')}</h1>
      <p role="alert">{t('common.loadFailedDescription')}</p>
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={() => window.location.reload()}
      >
        {t('gate.retry')}
      </button>
    </main>
  );
}
