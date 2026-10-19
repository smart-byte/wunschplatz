import { describe, it, expect, beforeEach } from 'vitest';

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
      name: 'P1',
      grades: [5],
      maxCapacity: 10,
      targetCapacity: 8,
    });
    const id = useProjectsStore.getState().projects[0].id;
    useProjectsStore.getState().updateProject(id, { name: 'P1-new' });
    expect(useProjectsStore.getState().projects[0].name).toBe('P1-new');
  });

  it('removes a project', () => {
    useProjectsStore.getState().addProject({
      name: 'P1',
      grades: [5],
      maxCapacity: 10,
      targetCapacity: 8,
    });
    const id = useProjectsStore.getState().projects[0].id;
    useProjectsStore.getState().removeProject(id);
    expect(useProjectsStore.getState().projects).toHaveLength(0);
  });
});
