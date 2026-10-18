import { describe, it, expect } from 'vitest';
import i18n from '@/i18n';
import appDe from '@/locales/de/app.json';
import appEn from '@/locales/en/app.json';
import landingDe from '@/locales/de/landing.json';
import landingEn from '@/locales/en/landing.json';

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' ? leafKeys(child as object, path) : [path];
  });
}

describe('i18n', () => {
  it('resolves landing keys in German', async () => {
    await i18n.changeLanguage('de');
    expect(i18n.t('landing:hero.title')).toBe('Faire Projektverteilung für deine Schule.');
  });

  it('switches to English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('landing:hero.title')).toBe('Fair project assignment for your school.');
  });

  it('maps region codes onto supported languages', async () => {
    await i18n.changeLanguage('en-US');
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('keeps document.documentElement.lang in sync', async () => {
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await i18n.changeLanguage('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('uses singular forms for a count of one', async () => {
    await i18n.changeLanguage('de');
    const de = (key: string) => i18n.t(`app:${key}`, { count: 1 });
    expect(de('rounds.projectCount')).toBe('1 Projekt');
    expect(de('optimize.capacityHint')).toMatch(/^Es fehlt insgesamt 1 Platz\./);
    expect(de('distribution.card.interestedTooltip')).toMatch(/^1 Schüler hat /);
    expect(de('blueprint.description')).toMatch(/aus deinem Projekt\.$/);
    await i18n.changeLanguage('en');
    const en = (key: string) => i18n.t(`app:${key}`, { count: 1 });
    expect(en('rounds.studentCount')).toBe('1 student');
    expect(en('distribution.card.totalInterested')).toBe('1 student total');
    expect(en('optimize.capacityHint')).toMatch(/^There is 1 fewer place /);
    await i18n.changeLanguage('de');
  });

  it('keeps all app translation keys in sync', () => {
    expect(leafKeys(appEn).sort()).toEqual(leafKeys(appDe).sort());
  });

  it('keeps all landing translation keys in sync', () => {
    expect(leafKeys(landingEn).sort()).toEqual(leafKeys(landingDe).sort());
  });
});
