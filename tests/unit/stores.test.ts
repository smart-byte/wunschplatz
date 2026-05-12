import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const store = new Map();
  return {
    get: vi.fn(async (k) => store.get(k)),
    set: vi.fn(async (k, v) => { store.set(k, v); }),
    del: vi.fn(async (k) => { store.delete(k); }),
    createStore: vi.fn(() => ({})),
  };
});

import { useProjectsStore } from '@/store/useProjectsStore';

describe('useProjectsStore', () => {
  beforeEach(() => {
    useProjectsStore.setState({ projects: [] });
  });

  it('adds a project', () => {
    useProjectsStore.getState().addProject({
      name: 'P1',
      grades: [5, 6],
      maxCapacity: 20,
      targetCapacity: 15,
    });
    expect(useProjectsStore.getState().projects).toHaveLength(1);
    expect(useProjectsStore.getState().projects[0].name).toBe('P1');
    expect(useProjectsStore.getState().projects[0].id).toBeDefined();
  });

  it('updates a project', () => {
    useProjectsStore.getState().addProject({
      name: 'P1', grades: [5], maxCapacity: 10, targetCapacity: 8,
    });
    const id = useProjectsStore.getState().projects[0].id;
    useProjectsStore.getState().updateProject(id, { name: 'P1-new' });
    expect(useProjectsStore.getState().projects[0].name).toBe('P1-new');
  });

  it('removes a project', () => {
    useProjectsStore.getState().addProject({
      name: 'P1', grades: [5], maxCapacity: 10, targetCapacity: 8,
    });
    const id = useProjectsStore.getState().projects[0].id;
    useProjectsStore.getState().removeProject(id);
    expect(useProjectsStore.getState().projects).toHaveLength(0);
  });
});
