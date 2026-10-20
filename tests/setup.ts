import '@testing-library/jest-dom/vitest';

import { beforeEach, afterEach } from 'vitest';
import { stopWorkspaceSync } from '@/store/workspaceSync';
import { useSessionStore } from '@/store/session';

// jsdom has no scrolling; ScrollRestoration calls this on every navigation.
window.scrollTo = () => {};

beforeEach(() => {
  stopWorkspaceSync();
  sessionStorage.clear();
  useSessionStore.setState({ phase: 'ready', error: null, generation: 0, notice: null });
});

afterEach(stopWorkspaceSync);
