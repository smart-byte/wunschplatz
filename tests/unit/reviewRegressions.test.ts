import { describe, expect, it } from 'vitest';
import { utils } from 'xlsx';
import { readWorkbook } from '@/excel/readWorkbook';
import { parseProjectRows } from '@/excel/importProjects';
import { parseStudentRows, findProjectByName } from '@/excel/importStudents';
import { parseFormResponses } from '@/forms/importFormResponses';
import { buildBlueprint } from '@/forms/buildBlueprint';
import { parseGrades } from '@/lib/validation';
import {
  distributionRows,
  distributionStats,
  solverInputSignature,
  assignmentConflicts,
} from '@/lib/distribution';
import { buildExportWorkbook } from '@/excel/exportDistribution';
import { commitProjects, reconcileProjectIds } from '@/store/commitProjects';
import { setActiveRoundBlueprint } from '@/store/roundsTransaction';
import { useProjectsStore } from '@/store/useProjectsStore';
import { useStudentsStore } from '@/store/useStudentsStore';
import { useAssignmentsStore } from '@/store/useAssignmentsStore';
import { useRoundsStore } from '@/store/useRoundsStore';
import { defaultSolverConfig, type Project, type Student } from '@/types';

const projects: Project[] = [
  { id: 'p1', name: 'Töpfern', grades: [7], maxCapacity: 1, targetCapacity: 1 },
  { id: 'p2', name: 'Schach', grades: [7], maxCapacity: 2, targetCapacity: 2 },
];
const student: Student = {
  id: 's1',
  firstName: 'Anna',
  lastName: 'Müller',
  className: '7a',
  grade: 7,
  priorities: ['p1', 'p2'],
};
const headers = ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', 'Prio1', 'Prio2'];
function blueprint(items = projects, date = '2026-09-04T10:00:00Z') {
  const result = buildBlueprint(items, date);
  if (!result.ok) throw new Error('Invalid fixture');
  return result.blueprint;
}

describe('import regressions', () => {
  it('decodes a UTF-8 CSV without a BOM before matching German project labels', async () => {
    const bytes = new TextEncoder().encode(
      'Vorname,Nachname,Klasse,Jahrgang,Prio1,Prio2\nAnna,Müller,7a,7,Töpfern,Schach',
    );
    const wb = await readWorkbook({ name: 'answers.csv', arrayBuffer: async () => bytes.buffer });
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    expect(parseStudentRows(rows, projects).students[0]).toMatchObject({
      lastName: 'Müller',
      priorities: ['p1', 'p2'],
    });
  });
  it('decodes a Windows-1252 CSV, the default of German Excel', async () => {
    const text = 'Vorname,Nachname,Klasse,Jahrgang,Prio1,Prio2\nAnna,Müller,7a,7,Töpfern,Schach';
    // ü and ö are single bytes (0xFC, 0xF6) in Windows-1252, which strict UTF-8 rejects.
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));
    const wb = await readWorkbook({ name: 'answers.csv', arrayBuffer: async () => bytes.buffer });
    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    expect(parseStudentRows(rows, projects).students[0]).toMatchObject({
      lastName: 'Müller',
      priorities: ['p1', 'p2'],
    });
  });
  it.each(['Unknown', 'Schach'])(
    'does not promote second wishes after an invalid or duplicate first wish: %s',
    (first) => {
      const result = parseStudentRows(
        [headers, ['Anna', 'Müller', '7a', 7, first, 'Schach']],
        projects,
      );
      expect(result.students).toEqual([]);
      expect(result.errors[0].severity).toBe('error');
    },
  );
  it('treats duplicate exact names as ambiguous, including normalization', () => {
    const duplicated = [projects[0], { ...projects[0], id: 'p3', name: ' TÖPFERN ' }];
    expect(findProjectByName('Töpfern', duplicated)).toMatchObject({
      ok: false,
      reason: 'ambiguous',
    });
    const parsed = parseProjectRows([
      ['Name', 'Jahrgänge', 'Max', 'Soll'],
      ['Chess', 7, 10, 8],
      [' chess ', 7, 10, 8],
    ]);
    expect(parsed.errors[0].code).toBe('duplicateName');
  });
  it.each([7.5, '7abc', Infinity, NaN])(
    'rejects malformed grades in both student import formats: %s',
    (grade) => {
      expect(
        parseStudentRows([headers, ['A', 'B', '7a', grade, 'Schach', 'Töpfern']], projects)
          .students,
      ).toEqual([]);
      expect(
        parseFormResponses(
          [
            ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', '1. Wahl', '2. Wahl'],
            ['A', 'B', '7a', grade, 'Schach', 'Töpfern'],
          ],
          projects,
          blueprint(),
        ).students,
      ).toEqual([]);
    },
  );
  it.each([1.5, '10people', Infinity, 'NaN'])(
    'rejects malformed project capacities: %s',
    (capacity) => {
      expect(
        parseProjectRows([
          ['Name', 'Jahrgänge', 'Max', 'Soll'],
          ['Chess', 7, capacity, 0],
        ]).projects,
      ).toEqual([]);
    },
  );
  it.each(['5.5', '5junk', '5-99999999999999', '7-5', '5,15'])(
    'rejects malformed or out-of-range grade lists: %s',
    (grades) => {
      expect(parseGrades(grades)).toEqual([]);
    },
  );
  it('retains an old label-to-ID map across regeneration and label reuse', () => {
    useRoundsStore.setState({
      rounds: [{ id: 'r', name: 'Round', status: 'active', createdAt: 'x' }],
      activeRoundId: 'r',
    });
    const original = blueprint();
    setActiveRoundBlueprint(original);
    const renamed = projects.map((p) => ({ ...p, name: p.id === 'p1' ? 'Pottery' : 'Töpfern' }));
    setActiveRoundBlueprint(blueprint(renamed, '2026-09-04T11:00:00Z'));
    const round = useRoundsStore.getState().rounds[0];
    expect(round.blueprintHistory).toEqual([original]);
    const response = [
      ['Vorname', 'Nachname', 'Klasse', 'Jahrgang', '1. Wahl', '2. Wahl'],
      ['A', 'B', '7a', 7, 'Töpfern', 'Schach'],
    ];
    expect(
      parseFormResponses(response, renamed, round.blueprintHistory![0]).students[0].priorities,
    ).toEqual(['p1', 'p2']);
  });
});

describe('current distribution data', () => {
  it('counts missing assignments and deleted projects as unassigned', () => {
    const rows = distributionRows([student, { ...student, id: 's2' }], projects, [
      { studentId: 's1', projectId: 'gone', priorityRank: 1, manuallyEdited: false },
    ]);
    expect(distributionStats(rows.map((row) => row.assignment))).toMatchObject({
      totalStudents: 2,
      unassigned: 2,
      notInTop5: 0,
    });
  });
  it('recomputes ranks in both summary data and spreadsheet output', () => {
    const changed = { ...student, priorities: ['p2', 'p1'] };
    const assignments = [
      { studentId: 's1', projectId: 'p1', priorityRank: 1, manuallyEdited: false },
    ];
    const rows = distributionRows([changed], projects, assignments);
    expect(distributionStats(rows.map((row) => row.assignment)).assignedByPriority).toEqual([
      0, 1, 0, 0, 0,
    ]);
    const wb = buildExportWorkbook([changed], projects, assignments, 'en');
    expect(utils.sheet_to_json(wb.Sheets.Distribution)[0]).toMatchObject({
      'Fulfilled Priority': 2,
    });
  });
  it('detects changes to every solver input, while ignoring display-only names', () => {
    const signature = solverInputSignature([student], projects, defaultSolverConfig);
    for (const change of [{ grade: 8 }, { priorities: ['p2', 'p1'] }, { groupId: 'g' }]) {
      expect(
        solverInputSignature([{ ...student, ...change }], projects, defaultSolverConfig),
      ).not.toBe(signature);
    }
    expect(
      solverInputSignature(
        [student],
        [{ ...projects[0], maxCapacity: 3 }, projects[1]],
        defaultSolverConfig,
      ),
    ).not.toBe(signature);
    expect(
      solverInputSignature([student], projects, { ...defaultSolverConfig, overTargetPenalty: 20 }),
    ).not.toBe(signature);
    expect(
      solverInputSignature([{ ...student, lastName: 'Smith' }], projects, defaultSolverConfig),
    ).toBe(signature);
  });
  it('uses the same grade/capacity conflicts for manual moves, excluding the moving student', () => {
    const rows = distributionRows([student], projects, [
      { studentId: 's1', projectId: 'p1', priorityRank: 1, manuallyEdited: false },
    ]);
    expect(assignmentConflicts(student, projects[0], rows)).toMatchObject({
      full: false,
      gradeMismatch: false,
    });
    expect(
      assignmentConflicts({ ...student, id: 's2', grade: 8 }, projects[0], rows),
    ).toMatchObject({ full: true, gradeMismatch: true });
  });
  it('retains IDs on replacement and clears affected whole wish lists on project removal', () => {
    useProjectsStore.getState().setProjects(projects);
    useStudentsStore.getState().setStudents([student]);
    useAssignmentsStore.getState().clear();
    const imported = reconcileProjectIds(
      projects.map((p) => ({ ...p, name: p.name.toUpperCase() })),
      projects,
    );
    expect(imported.map((p) => p.id)).toEqual(['p1', 'p2']);
    commitProjects(imported);
    expect(useStudentsStore.getState().students[0].priorities).toEqual(['p1', 'p2']);
    commitProjects([imported[1]]);
    expect(useStudentsStore.getState().students[0].priorities).toEqual([]);
  });
});
