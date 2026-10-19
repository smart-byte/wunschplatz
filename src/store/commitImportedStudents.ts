import type { Student } from '@/types';
import { useStudentsStore } from './useStudentsStore';
import { useAssignmentsStore } from './useAssignmentsStore';
import { pickFreeColorKey } from '@/lib/groups';

export function commitImportedStudents(students: Omit<Student, 'id'>[]): {
  count: number;
  groupCount: number;
} {
  const withIds = students.map((s) => ({ ...s, id: crypto.randomUUID() }));
  useStudentsStore.getState().setStudents(withIds);

  const groupIds = [...new Set(withIds.map((s) => s.groupId).filter((g): g is string => !!g))];
  const usedKeys: string[] = [];
  for (const gid of groupIds) {
    const key = pickFreeColorKey(gid, usedKeys);
    useStudentsStore.getState().setGroupColor(gid, key);
    usedKeys.push(key);
  }

  useAssignmentsStore.getState().clear();
  return { count: withIds.length, groupCount: groupIds.length };
}
