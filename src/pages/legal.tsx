import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { ImpressumDe, ImpressumEn } from '@/components/legal/ImpressumContent';
import { PrivacyDe, PrivacyEn } from '@/components/legal/PrivacyContent';

const prose = [
  '[&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-[21px] [&_h2]:font-medium [&_h2]:tracking-[-0.01em] [&_h2]:text-foreground',
  '[&_h3]:mt-6 [&_h3]:text-[15px] [&_h3]:font-semibold',
  '[&_p]:mt-3 [&_address]:mt-3 [&_address]:not-italic',
  '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
  '[&_a]:font-medium [&_a]:text-mark [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:no-underline',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
].join(' ');

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <LandingHeader />
      <main className="mx-auto max-w-[720px] px-6 pb-16 pt-12 sm:px-11">
        <h1 className="font-serif text-[34px] font-medium leading-tight tracking-[-0.01em]">
          {title}
        </h1>
        <div className={`mt-6 text-[15px]/[1.65] text-prose ${prose}`}>{children}</div>
      </main>
      <footer className="mx-auto max-w-[720px] px-6 pb-10 sm:px-11">
        <LegalLinks className="border-t border-rule pt-4" />
      </footer>
    </div>
  );
}

export function ImpressumPage() {
  const { t, i18n } = useTranslation('app');
  return (
    <LegalPage title={t('legal.impressumTitle')}>
      {i18n.resolvedLanguage === 'en' ? <ImpressumEn /> : <ImpressumDe />}
    </LegalPage>
  );
}

export function PrivacyPage() {
  const { t, i18n } = useTranslation('app');
  return (
    <LegalPage title={t('legal.privacyTitle')}>
      {i18n.resolvedLanguage === 'en' ? <PrivacyEn /> : <PrivacyDe />}
    </LegalPage>
  );
}
