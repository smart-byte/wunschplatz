import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project, Student } from '@/types';

/**
 * Build a workbook with one sheet containing all students. Columns match
 * what the student importer expects so export → import is a round-trip.
 *
 * Group IDs (uuids) are converted to short sequential numbers ("1", "2", …)
 * in the order they appear so the file stays readable. Ungrouped students
 * get an empty cell.
 */
export function buildStudentsWorkbook(students: Student[], projects: Project[]): WorkBook {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '';

  // Map each unique groupId to a sequential label in encounter order.
  const groupLabel = new Map<string, string>();
  let nextGroupNum = 1;
  for (const s of students) {
    if (s.groupId && !groupLabel.has(s.groupId)) {
      groupLabel.set(s.groupId, String(nextGroupNum++));
    }
  }

  const rows = students.map((s) => ({
    Vorname: s.firstName,
    Nachname: s.lastName,
    Klasse: s.className,
    Jahrgang: s.grade,
    Gruppe: s.groupId ? groupLabel.get(s.groupId) ?? '' : '',
    Prio1: s.priorities[0] ? projectName(s.priorities[0]) : '',
    Prio2: s.priorities[1] ? projectName(s.priorities[1]) : '',
    Prio3: s.priorities[2] ? projectName(s.priorities[2]) : '',
    Prio4: s.priorities[3] ? projectName(s.priorities[3]) : '',
    Prio5: s.priorities[4] ? projectName(s.priorities[4]) : '',
  }));

  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(rows), 'Schüler');
  return wb;
}
