import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureRoundsReady } from '@/store/bootstrapRounds';
import { useSessionStore } from '@/store/session';
import { useRoundsStore } from '@/store/useRoundsStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
  /** Rendered in every state, so the app frame stands while storage loads. */
  nav: ReactNode;
  children: ReactNode;
};

export function RoundsGate({ nav, children }: Props) {
  const { t } = useTranslation('app');
  const phase = useSessionStore((s) => s.phase);
  const error = useSessionStore((s) => s.error);
  const notice = useSessionStore((s) => s.notice);
  const loaded = useRoundsStore((s) => s.activeRoundId !== null);
  useEffect(() => {
    if (!notice) return;
    toast.info(t(`gate.${notice.key}`, notice.values));
    useSessionStore.setState({ notice: null });
  }, [notice, t]);
  useEffect(() => {
    void ensureRoundsReady(undefined, t('rounds.defaultName', { n: 1 })).catch(() => {
      // The session error is rendered below.
    });
  }, [t]);

  const shell = (content: ReactNode) => (
    <div className="relative isolate flex min-h-screen flex-col bg-paper">
      {nav}
      {content}
    </div>
  );

  if (phase === 'error' && !loaded) {
    return shell(
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">{t(`gate.${error ?? 'storage'}Title`)}</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          {t(`gate.${error ?? 'storage'}Description`)}
        </p>
        <Button onClick={() => window.location.reload()}>{t('gate.retry')}</Button>
      </main>,
    );
  }
  if (phase === 'loading') {
    return shell(
      <div
        role="status"
        className="flex flex-1 items-center justify-center text-sm text-muted-foreground animate-delayed-in"
      >
        {t('gate.loading')}
      </div>,
    );
  }
  const switching = phase === 'switching';
  return (
    <>
      <div {...(switching ? { inert: '' } : {})} aria-busy={switching}>
        {shell(
          <>
            {/* Saving stopped, but loaded data stays readable, so it can still be exported. */}
            {phase === 'error' && (
              <div
                role="alert"
                className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm sm:px-8"
              >
                <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="flex-1">
                    <strong>{t('gate.storageTitle')}.</strong> {t('gate.saveFailedDescription')}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    {t('gate.retry')}
                  </Button>
                </div>
              </div>
            )}
            {children}
          </>,
        )}
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
