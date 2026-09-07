import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureRoundsReady } from '@/store/bootstrapRounds';
import { useSessionStore } from '@/store/session';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function RoundsGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('app');
  const phase = useSessionStore((s) => s.phase);
  const error = useSessionStore((s) => s.error);
  const notice = useSessionStore((s) => s.notice);
  useEffect(() => {
    if (!notice) return;
    toast.info(t(`gate.${notice}`));
    useSessionStore.setState({ notice: null });
  }, [notice, t]);
  useEffect(() => {
    void ensureRoundsReady(undefined, t('rounds.defaultName', { n: 1 })).catch(() => {
      // The session error is rendered below.
    });
  }, [t]);

  if (phase === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">{t(`gate.${error ?? 'storage'}Title`)}</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          {t(`gate.${error ?? 'storage'}Description`)}
        </p>
        <Button onClick={() => window.location.reload()}>{t('gate.retry')}</Button>
      </main>
    );
  }
  if (phase === 'loading') {
    return (
      <div
        role="status"
        className="flex h-screen items-center justify-center text-sm text-muted-foreground"
      >
        {t('gate.loading')}
      </div>
    );
  }
  const switching = phase === 'switching';
  return (
    <>
      <div {...(switching ? { inert: '' } : {})} aria-busy={switching}>
        {children}
      </div>
      {switching && (
        <div
          role="status"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 text-sm backdrop-blur-sm"
        >
          {t('gate.switching')}
        </div>
      )}
    </>
  );
}
