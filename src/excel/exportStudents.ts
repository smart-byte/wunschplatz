import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project, Student } from '@/types';

export function buildStudentsWorkbook(
  students: Student[],
  projects: Project[],
  language = 'de',
): WorkBook {
  const english = language.toLowerCase().startsWith('en');
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '';

  const groupLabel = new Map<string, string>();
  let nextGroupNum = 1;
  for (const s of students) {
    if (s.groupId && !groupLabel.has(s.groupId)) {
      groupLabel.set(s.groupId, String(nextGroupNum++));
    }
  }

  const labels = english
    ? {
        first: 'First Name',
        last: 'Last Name',
        className: 'Class',
        grade: 'Grade',
        group: 'Group',
        priority: 'Priority',
      }
    : {
        first: 'Vorname',
        last: 'Nachname',
        className: 'Klasse',
        grade: 'Jahrgang',
        group: 'Gruppe',
        priority: 'Prio',
      };
  const rows = students.map((s) => ({
    [labels.first]: s.firstName,
    [labels.last]: s.lastName,
    [labels.className]: s.className,
    [labels.grade]: s.grade,
    [labels.group]: s.groupId ? (groupLabel.get(s.groupId) ?? '') : '',
    [`${labels.priority}1`]: s.priorities[0] ? projectName(s.priorities[0]) : '',
    [`${labels.priority}2`]: s.priorities[1] ? projectName(s.priorities[1]) : '',
    [`${labels.priority}3`]: s.priorities[2] ? projectName(s.priorities[2]) : '',
    [`${labels.priority}4`]: s.priorities[3] ? projectName(s.priorities[3]) : '',
    [`${labels.priority}5`]: s.priorities[4] ? projectName(s.priorities[4]) : '',
  }));

  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(rows), english ? 'Students' : 'Schüler');
  return wb;
}
