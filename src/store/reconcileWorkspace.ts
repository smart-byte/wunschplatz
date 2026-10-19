import type { SavedRound } from './persist';
import { mergeChanges, sameValue } from './mergeChanges';

export function reconcileWorkspace(base: SavedRound[], local: SavedRound[], remote: SavedRound[]) {
  const result = mergeChanges(base, local, remote, ['blueprint', 'run']);
  if (result.value.length === 0 && remote.length > 0) {
    result.value = remote;
    result.conflict = true;
  }
  result.value = result.value.map((round) => {
    const data = round.data;
    const projectIds = new Set(data.projects.map((p) => p.id));
    const studentIds = new Set(data.students.map((s) => s.id));
    const before = base.find((r) => r.id === round.id)?.data;
    const edited = local.find((r) => r.id === round.id)?.data;
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
