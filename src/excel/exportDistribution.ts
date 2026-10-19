import { distributionRows } from '@/lib/distribution';
import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project, Student, Assignment } from '@/types';
import { formatGrades } from '@/lib/utils';

export function buildExportWorkbook(
  students: Student[],
  projects: Project[],
  assignments: Assignment[],
  language = 'de',
): WorkBook {
  const english = language.toLowerCase().startsWith('en');
  const labels = english
    ? {
        first: 'First Name',
        last: 'Last Name',
        className: 'Class',
        grade: 'Grade',
        assigned: 'Assigned Project',
        fulfilled: 'Fulfilled Priority',
        outside: 'Outside top 5',
        project: 'Project',
        grades: 'Grades',
        occupancy: 'Occupancy',
        max: 'Maximum',
        target: 'Target',
        participant: 'Participant',
        distributionSheet: 'Distribution',
        projectsSheet: 'Projects',
      }
    : {
        first: 'Vorname',
        last: 'Nachname',
        className: 'Klasse',
        grade: 'Jahrgang',
        assigned: 'Zugewiesenes Projekt',
        fulfilled: 'Erfüllte Prio',
        outside: 'außerhalb',
        project: 'Projekt',
        grades: 'Jahrgänge',
        occupancy: 'Belegung',
        max: 'Max',
        target: 'Soll',
        participant: 'Teilnehmer',
        distributionSheet: 'Verteilung',
        projectsSheet: 'Projekte',
      };
  const rows = distributionRows(students, projects, assignments);
  const aMap = new Map(rows.map((r) => r.assignment).map((a) => [a.studentId, a]));

  const verteilungRows = rows.map(({ student: s, assignment: a, assignedProject: project }) => {
    return {
      [labels.first]: s.firstName,
      [labels.last]: s.lastName,
      [labels.className]: s.className,
      [labels.grade]: s.grade,
      [labels.assigned]: project?.name ?? '—',
      [labels.fulfilled]: a?.priorityRank ?? (a?.projectId ? labels.outside : '—'),
    };
  });

  const projekteRows = projects.flatMap((p) => {
    const assigned = students.filter((s) => aMap.get(s.id)?.projectId === p.id);
    if (assigned.length === 0) {
      return [
        {
          [labels.project]: p.name,
          [labels.grades]: formatGrades(p.grades),
          [labels.occupancy]: 0,
          [labels.max]: p.maxCapacity,
          [labels.target]: p.targetCapacity,
          [labels.participant]: '',
        },
      ];
    }
    return assigned.map((s, i) => ({
      [labels.project]: i === 0 ? p.name : '',
      [labels.grades]: i === 0 ? formatGrades(p.grades) : '',
      [labels.occupancy]: i === 0 ? assigned.length : '',
      [labels.max]: i === 0 ? p.maxCapacity : '',
      [labels.target]: i === 0 ? p.targetCapacity : '',
      [labels.participant]: `${s.lastName}, ${s.firstName} (${s.className})`,
    }));
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(verteilungRows), labels.distributionSheet);
  utils.book_append_sheet(wb, utils.json_to_sheet(projekteRows), labels.projectsSheet);
  return wb;
}
