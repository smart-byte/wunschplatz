import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    get matches() {
      return matches;
    },
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }));
  return {
    listeners,
    change(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('follows the media query and stops listening on unmount', () => {
  const media = stubMatchMedia(false);
  const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1280px)'));
  expect(result.current).toBe(false);

  act(() => media.change(true));
  expect(result.current).toBe(true);

  unmount();
  expect(media.listeners.size).toBe(0);
});
