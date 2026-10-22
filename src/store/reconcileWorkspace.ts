import type { SavedRound } from './persist';
import { mergeChanges, sameValue } from './mergeChanges';
import { normalizeLabel } from '@/forms/normalizeLabel';

function duplicateNames(projects: { name: string }[] = []) {
  return new Set(projects.map((p) => normalizeLabel(p.name))).size < projects.length;
}

export function reconcileWorkspace(base: SavedRound[], local: SavedRound[], remote: SavedRound[]) {
  const result = mergeChanges(base, local, remote, ['blueprint', 'run']);
  if (result.value.length === 0 && remote.length > 0) {
    result.value = remote;
    result.conflict = true;
  }
  result.value = result.value.map((round) => {
    let data = round.data;
    const before = base.find((r) => r.id === round.id)?.data;
    const edited = local.find((r) => r.id === round.id)?.data;
    const latest = remote.find((r) => r.id === round.id)?.data;
    // An import replaces every student with fresh IDs. Merging two concurrent imports by ID
    // would keep both rosters, so the local import wins and the other one is reported.
    // Without saved students an import looks like manual additions, so those still merge.
    const baseIds = new Set(before?.students.map((s) => s.id));
    const replaced = (list?: { id: string }[]) =>
      baseIds.size > 0 && !!list?.length && list.every((s) => !baseIds.has(s.id));
    const localIds = new Set(edited?.students.map((s) => s.id));
    if (
      replaced(edited?.students) &&
      replaced(latest?.students) &&
      latest!.students.every((s) => !localIds.has(s.id))
    ) {
      data = { ...data, students: edited!.students };
      result.conflict = true;
    }
    // The project form only checks names in its own tab; report duplicates the merge creates.
    if (
      duplicateNames(data.projects) &&
      !duplicateNames(edited?.projects) &&
      !duplicateNames(latest?.projects)
    ) {
      result.conflict = true;
    }
    const projectIds = new Set(data.projects.map((p) => p.id));
    const studentIds = new Set(data.students.map((s) => s.id));
    const projects = data.projects.map((project) => {
      if (project.targetCapacity <= project.maxCapacity) return project;
      const source = edited?.projects.find((p) => p.id === project.id);
      if (!source) return project;
      result.conflict = true;
      return { ...project, maxCapacity: source.maxCapacity, targetCapacity: source.targetCapacity };
    });
    let students = data.students.map((s) =>
      s.priorities.some((id) => !projectIds.has(id)) ? { ...s, priorities: [] } : s,
    );
    const groups = new Map<string, typeof students>();
    const oldStudents = new Map(before?.students.map((s) => [s.id, s]));
    const editedStudents = new Map(edited?.students.map((s) => [s.id, s]));
    for (const student of students) {
      if (!student.groupId) continue;
      const members = groups.get(student.groupId) ?? [];
      members.push(student);
      groups.set(student.groupId, members);
    }
    const groupPriorities = new Map<string, string[]>();
    for (const [groupId, members] of groups) {
      const changed = members.find((s) => {
        const old = oldStudents.get(s.id);
        const next = editedStudents.get(s.id);
        return old && next && !sameValue(old.priorities, next.priorities);
      });
      groupPriorities.set(groupId, (changed ?? members[0]).priorities);
    }
    students = students.map((s) =>
      !s.groupId
        ? s
        : groups.get(s.groupId)!.length < 2
          ? { ...s, groupId: undefined }
          : { ...s, priorities: groupPriorities.get(s.groupId)! },
    );
    const distributions = data.distributions.map((d) => ({
      ...d,
      assignments: d.assignments
        .filter((a) => studentIds.has(a.studentId))
        .map((a) =>
          a.projectId && !projectIds.has(a.projectId)
            ? { ...a, projectId: null, priorityRank: null }
            : a,
        ),
    }));
    return {
      ...round,
      data: {
        ...data,
        projects,
        students,
        distributions,
        distributionActiveId:
          data.distributionActiveId === null ||
          distributions.some((d) => d.id === data.distributionActiveId)
            ? data.distributionActiveId
            : (distributions.at(-1)?.id ?? null),
      },
    };
  });
  return result;
}
