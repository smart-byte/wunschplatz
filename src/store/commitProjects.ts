import { v4 as uuid } from 'uuid';
import type { Project } from '@/types';
import { normalizeLabel } from '@/forms/normalizeLabel';
import { useProjectsStore } from './useProjectsStore';
import { useStudentsStore } from './useStudentsStore';
import { useAssignmentsStore } from './useAssignmentsStore';
import { assertEditable } from './session';

export function reconcileProjectIds(
  incoming: Omit<Project, 'id'>[],
  existing: Project[],
): Project[] {
  return incoming.map((project) => {
    const matches = existing.filter((p) => normalizeLabel(p.name) === normalizeLabel(project.name));
    return { ...project, id: matches.length === 1 ? matches[0].id : uuid() };
  });
}

export function commitProjects(projects: Project[]): void {
  assertEditable();
  const ids = new Set(projects.map((p) => p.id));
  const removed = useProjectsStore.getState().projects.some((p) => !ids.has(p.id));
  if (removed) {
    // Removing one wish would silently promote the ranks of later wishes.
    useStudentsStore.setState((s) => ({
      students: s.students.map((student) =>
        student.priorities.some((id) => !ids.has(id)) ? { ...student, priorities: [] } : student,
      ),
    }));
    useAssignmentsStore.getState().clear();
  }
  useProjectsStore.getState().setProjects(projects);
}
