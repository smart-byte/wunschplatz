import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Project, Student, Assignment } from '@/types';

export function buildExportWorkbook(
  students: Student[],
  projects: Project[],
  assignments: Assignment[],
): WorkBook {
  const aMap = new Map(assignments.map((a) => [a.studentId, a]));
  const pMap = new Map(projects.map((p) => [p.id, p]));

  const verteilungRows = students.map((s) => {
    const a = aMap.get(s.id);
    const project = a?.projectId ? pMap.get(a.projectId) : null;
    return {
      Vorname: s.firstName,
      Nachname: s.lastName,
      Klasse: s.className,
      Jahrgang: s.grade,
      'Zugewiesenes Projekt': project?.name ?? '—',
      'Erfüllte Prio': a?.priorityRank ?? (a?.projectId ? 'außerhalb' : '—'),
      Manuell: a?.manuallyEdited ? 'ja' : '',
    };
  });

  const projekteRows = projects.flatMap((p) => {
    const assigned = students.filter((s) => aMap.get(s.id)?.projectId === p.id);
    if (assigned.length === 0) {
      return [{
        Projekt: p.name,
        Jahrgänge: p.grades.join(', '),
        Belegung: 0,
        'Max': p.maxCapacity,
        Soll: p.targetCapacity,
        Teilnehmer: '',
      }];
    }
    return assigned.map((s, i) => ({
      Projekt: i === 0 ? p.name : '',
      Jahrgänge: i === 0 ? p.grades.join(', ') : '',
      Belegung: i === 0 ? assigned.length : '',
      'Max': i === 0 ? p.maxCapacity : '',
      Soll: i === 0 ? p.targetCapacity : '',
      Teilnehmer: `${s.lastName}, ${s.firstName} (${s.className})`,
    }));
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(verteilungRows), 'Verteilung');
  utils.book_append_sheet(wb, utils.json_to_sheet(projekteRows), 'Projekte');
  return wb;
}
