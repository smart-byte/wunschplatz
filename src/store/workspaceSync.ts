import {
  type SavedRound,
  type Workspace,
  createWorkspaceStorage,
  validateWorkspace,
} from './persist';
import { reconcileWorkspace } from './reconcileWorkspace';
import { sameValue } from './mergeChanges';

type Options = {
  capture: () => SavedRound[];
  apply: (rounds: SavedRound[]) => void;
  onCommit: (revision: number, conflict: boolean) => void;
  onConflict: () => void;
  onError: () => void;
};

export function createWorkspaceSync(
  initial: Workspace,
  storage: ReturnType<typeof createWorkspaceStorage>,
  options: Options,
) {
  let baseline = initial;
  let chain = Promise.resolve();
  let failure: unknown;
  let failed = false;
  let dirty = false;
  let queued = false;
  let stopped = false;

  function enqueue(task: () => Promise<void>) {
    chain = chain.then(async () => {
      if (failed || stopped) return;
      try {
        await task();
      } catch (error) {
        failed = true;
        failure = error;
        options.onError();
      }
    });
  }

  function accept(saved: Workspace, beforePending: SavedRound[]) {
    if (stopped) return;
    const pending = options.capture();
    const merged = reconcileWorkspace(beforePending, pending, saved.rounds);
    baseline = saved;
    if (!sameValue(pending, merged.value)) options.apply(merged.value);
    dirty = !sameValue(saved.rounds, merged.value);
    if (merged.conflict) options.onConflict();
  }

  async function saveChanges() {
    while (dirty && !stopped) {
      dirty = false;
      const local = options.capture();
      if (sameValue(baseline.rounds, local)) continue;
      const base = baseline;
      let conflict = false;
      const saved = await storage.transact((value) => {
        if (!value) throw new Error('The saved workspace is missing');
        const latest = validateWorkspace(value);
        const merged = reconcileWorkspace(base.rounds, local, latest.rounds);
        conflict = merged.conflict;
        return validateWorkspace({
          version: 1,
          revision: latest.revision + 1,
          rounds: merged.value,
        });
      });
      if (stopped) return;
      accept(saved, local);
      if (conflict) options.onConflict();
      options.onCommit(saved.revision, conflict);
    }
  }

  return {
    save() {
      dirty = true;
      if (queued) return;
      queued = true;
      enqueue(async () => {
        queued = false;
        await saveChanges();
      });
    },
    refresh() {
      enqueue(async () => {
        await saveChanges();
        const saved = await storage.read();
        if (!saved) throw new Error('The saved workspace is missing');
        validateWorkspace(saved);
        if (saved.revision > baseline.revision) accept(saved, baseline.rounds);
        await saveChanges();
      });
    },
    async flush() {
      let pending;
      do {
        pending = chain;
        await pending;
      } while (pending !== chain);
      if (failed) throw failure;
    },
    hasUnsavedChanges: () => dirty || failed || !sameValue(baseline.rounds, options.capture()),
    stop() {
      stopped = true;
    },
  };
}

let current: ReturnType<typeof createWorkspaceSync> | undefined;
let cleanup: (() => void) | undefined;

export function registerWorkspaceSync(
  sync: ReturnType<typeof createWorkspaceSync>,
  dispose: () => void,
) {
  stopWorkspaceSync();
  current = sync;
  cleanup = dispose;
}

export function stopWorkspaceSync() {
  current?.stop();
  cleanup?.();
  current = undefined;
  cleanup = undefined;
}

export async function flushWorkspace(): Promise<void> {
  await current?.flush();
}
