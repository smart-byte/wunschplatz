import { useTranslation } from 'react-i18next';
import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export const router = createBrowserRouter(
  [
    {
      path: '/',
      HydrateFallback: RouteLoading,
      ErrorBoundary: RouteError,
      children: [
        { index: true, element: <LandingPage /> },
        {
          lazy: async () => ({
            Component: (await import('@/components/layout/AppShell')).AppShell,
          }),
          children: [
            {
              path: 'projects',
              lazy: async () => ({ Component: (await import('@/pages/ProjectsPage')).default }),
            },
            {
              path: 'students',
              lazy: async () => ({ Component: (await import('@/pages/StudentsPage')).default }),
            },
            {
              path: 'optimize',
              lazy: async () => ({ Component: (await import('@/pages/OptimizePage')).default }),
            },
            {
              path: 'distribution',
              lazy: async () => ({ Component: (await import('@/pages/DistributionPage')).default }),
            },
            {
              path: 'wunschrunden',
              lazy: async () => ({ Component: (await import('@/pages/WunschrundenPage')).default }),
            },
          ],
        },
      ],
    },
  ],
  { basename },
);

function RouteLoading() {
  const { t } = useTranslation('app');
  return (
    <div role="status" className="flex min-h-screen items-center justify-center p-6 text-sm">
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
