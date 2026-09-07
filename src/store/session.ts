import { create, type StateCreator, type StoreApi } from 'zustand';

type SessionNotice = 'conflict' | 'roundRemoved';
type SessionState = {
  phase: 'loading' | 'ready' | 'switching' | 'error';
  error: 'storage' | null;
  generation: number;
  notice: SessionNotice | null;
};

export const useSessionStore = create<SessionState>(() => ({
  phase: 'loading',
  error: null,
  generation: 0,
  notice: null,
}));

export function failSession(): void {
  useSessionStore.setState({ phase: 'error', error: 'storage' });
}

export function notifySession(notice: SessionNotice): void {
  useSessionStore.setState({ notice });
}

let internalWriteDepth = 0;

export function applyStoreUpdate(update: () => void): void {
  internalWriteDepth++;
  try {
    update();
  } finally {
    internalWriteDepth--;
  }
}

export function assertEditable(): void {
  if (!internalWriteDepth && useSessionStore.getState().phase !== 'ready') {
    throw new Error('Wait for the current storage operation to finish');
  }
}

function guardSetter<T>(set: StoreApi<T>['setState']): StoreApi<T>['setState'] {
  return (...args) => {
    assertEditable();
    return Reflect.apply(set, undefined, args);
  };
}

export function editableStore<T>(initializer: StateCreator<T>): StateCreator<T> {
  return (set, get, api) => {
    api.setState = guardSetter(api.setState);
    return initializer(guardSetter(set), get, api);
  };
}
