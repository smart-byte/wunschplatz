import type { Student } from '@/types';

export type StudentFilter = 'all' | 'noWishes' | 'grouped';

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss');
}

/** Every word of the query must appear in the name or class ("müller 7a", "anna mül"). */
export function matchesStudent(student: Student, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(`${student.firstName} ${student.lastName} ${student.className}`);
  return words.every((word) => haystack.includes(word));
}

export function filterStudents(students: Student[], query: string, filter: StudentFilter) {
  return students.filter(
    (s) =>
      (filter === 'all' ||
        (filter === 'noWishes' && s.priorities.length === 0) ||
        (filter === 'grouped' && !!s.groupId)) &&
      matchesStudent(s, query),
  );
}
