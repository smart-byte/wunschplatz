import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { toastFailure } from '@/lib/toastFailure';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

beforeAll(async () => {
  await i18n.changeLanguage('de');
});
beforeEach(() => vi.mocked(toast.error).mockClear());

describe('toastFailure', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://example.org/assets/xlsx.js',
    'error loading dynamically imported module: https://example.org/assets/xlsx.js',
    'Importing a module script failed.',
  ])('asks for a reload when an app file failed to load: %s', (message) => {
    toastFailure(new TypeError(message), 'Der Export ist fehlgeschlagen.');
    expect(toast.error).toHaveBeenCalledWith(
      i18n.t('app:common.chunkLoadFailed'),
      expect.objectContaining({ action: expect.objectContaining({ label: 'Neu laden' }) }),
    );
  });

  it('shows the given message for any other failure', () => {
    toastFailure(new Error('Disk full'), 'Der Export ist fehlgeschlagen.');
    expect(toast.error).toHaveBeenCalledWith('Der Export ist fehlgeschlagen.');
  });
});
