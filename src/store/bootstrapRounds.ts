import { useRoundsStore } from './useRoundsStore';
import { createWorkspaceStorage, validateWorkspace } from './persist';
import { readLegacyWorkspace } from './legacyWorkspace';
import { applySavedRounds, snapshotRounds, workspaceStores } from './workspaceState';
import { createWorkspaceSync, registerWorkspaceSync, stopWorkspaceSync } from './workspaceSync';
import { failSession, notifySession, useSessionStore } from './session';

const SELECTION_KEY = 'wunschplatz-active-round';
const CHANGE_KEY = 'wunschplatz-workspace-revision';

function selectedRound(): string | null {
  try {
    return sessionStorage.getItem(SELECTION_KEY);
  } catch {
    return null;
  }
}

function rememberSelection() {
  const id = useRoundsStore.getState().activeRoundId;
  if (id) {
    try {
      sessionStorage.setItem(SELECTION_KEY, id);
    } catch {
      /* Selection can remain in memory. */
    }
  }
}

export function createRoundsBootstrap() {
  let ready: Promise<void> | undefined;
  return (createdAt = new Date().toISOString(), defaultName = 'Wunschrunde 1'): Promise<void> => {
    ready ??= initialize(createdAt, defaultName);
    return ready;
  };
}

export const ensureRoundsReady = createRoundsBootstrap();

async function initialize(createdAt: string, defaultName: string): Promise<void> {
  try {
    const storage = createWorkspaceStorage();
    let saved = await storage.read();
    let selection = selectedRound();
    if (!saved) {
      const legacy = await readLegacyWorkspace(createdAt, defaultName);
      saved = await storage.transact((existing) => validateWorkspace(existing ?? legacy.workspace));
      selection ??= legacy.activeRoundId;
    }
    validateWorkspace(saved);
    applySavedRounds(
      saved.rounds,
      saved.rounds.some((r) => r.id === selection) ? selection : saved.rounds[0].id,
    );
    rememberSelection();
    let applying = false;
    const channel =
      typeof window.BroadcastChannel === 'function' ? new BroadcastChannel(CHANGE_KEY) : null;
    const sync = createWorkspaceSync(saved, storage, {
      capture: snapshotRounds,
      apply: (rounds) => {
        applying = true;
        try {
          applySavedRounds(rounds);
          rememberSelection();
        } finally {
          applying = false;
        }
      },
      onCommit: (revision, conflict) => {
        channel?.postMessage({ revision, conflict });
        if (!channel) {
          try {
            localStorage.setItem(CHANGE_KEY, String(revision));
          } catch {
            /* Focus refresh still works. */
          }
        }
      },
      onConflict: () => notifySession('conflict'),
      onError: failSession,
    });
    const unsubscribers = workspaceStores.map((store) =>
      store.subscribe(() => {
        if (!applying) {
          rememberSelection();
          sync.save();
        }
      }),
    );
    const refresh = () => sync.refresh();
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === CHANGE_KEY) refresh();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (sync.hasUnsavedChanges()) event.preventDefault();
    };
    if (channel)
      channel.onmessage = (event: MessageEvent<{ conflict?: boolean }>) => {
        if (event.data?.conflict) notifySession('conflict');
        refresh();
      };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', storageChanged);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', visible);
    registerWorkspaceSync(sync, () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      channel?.close();
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', visible);
    });
    useSessionStore.setState({ phase: 'ready', error: null });
    sync.refresh();
    await sync.flush();
  } catch (error) {
    failSession();
    throw error;
  }
}

if (import.meta.hot) import.meta.hot.dispose(stopWorkspaceSync);
