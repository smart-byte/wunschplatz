import { distributionStats, priorityRank, solverInputSignature } from '@/lib/distribution';
import { buildAssignmentGraph } from './buildGraph';
import { preassignGroups } from './preassignGroups';
import type { Project, Student, SolverConfig, Assignment, SolverStats, SolverRun } from '@/types';

export type SolveResult = {
  assignments: Assignment[];
  run: SolverRun;
  stats: SolverStats;
};

export function solveAssignments(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
  onProgress?: (done: number) => void,
): SolveResult {
  const preassignments = preassignGroups(students, projects, config);
  let seats = flowAround(
    students,
    projects,
    config,
    new Map([...preassignments].map(([studentId, { projectId }]) => [studentId, projectId])),
  );
  let score = scoreSeats(students, projects, config, seats);

  // The group step can cost a solo student a wish, so the flow without it is a second candidate.
  // A tie keeps the group result.
  if (preassignments.size > 0) {
    const withoutGroups = flowSeats(students, projects, config);
    const withoutScore = scoreSeats(students, projects, config, withoutGroups);
    if (withoutScore > score) {
      seats = withoutGroups;
      score = withoutScore;
    }
  }
  ({ seats, score } = searchGroups(students, projects, config, seats, score, onProgress));

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const assignments = students.map((student): Assignment => {
    const projectId = seats.get(student.id) ?? null;
    return {
      studentId: student.id,
      projectId,
      priorityRank: priorityRank(student, projectId === null ? null : projectById.get(projectId)),
      manuallyEdited: false,
    };
  });
  const stats = distributionStats(assignments);
  const run: SolverRun = {
    kind: 'solver',
    inputSignature: solverInputSignature(students, projects, config),
    timestamp: Date.now(),
    config,
    score,
    stats,
  };

  return { assignments, run, stats };
}

/**
 * Local search over group placements. A move seats one whole group on one of its wishes, or
 * releases its members to the flow, and the flow re-seats everyone else; it is kept when the
 * score improves. So a group can take a lower wish when that frees seats for other students.
 * It stops when no single move helps or the move budget runs out, so the result is good but
 * not proven optimal.
 */
function searchGroups(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
  start: Map<string, string>,
  startScore: number,
  onProgress?: (done: number) => void,
): { seats: Map<string, string>; score: number } {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const groups = new Map<string, Student[]>();
  for (const s of students)
    if (s.groupId) groups.set(s.groupId, [...(groups.get(s.groupId) ?? []), s]);
  const moves = [...groups.values()]
    .filter((members) => members.length >= 2)
    .map((members) => {
      const wishes = members[0].priorities.slice(0, 5).filter((id) => {
        const project = projectById.get(id);
        return project && members.every((m) => project.grades.includes(m.grade));
      });
      return { members, targets: [undefined, ...new Set(wishes)] };
    });
  if (moves.length === 0) return { seats: start, score: startScore };
  // Members that already sit with a group mate stay pinned there. The flow re-seats the rest
  // at least as well as before, so the start score cannot drop.
  let pins = new Map<string, string>();
  for (const members of groups.values()) {
    for (const m of members) {
      const at = start.get(m.id);
      if (at !== undefined && members.some((o) => o !== m && start.get(o.id) === at)) {
        pins.set(m.id, at);
      }
    }
  }
  let seats = flowAround(students, projects, config, pins);
  let score = scoreSeats(students, projects, config, seats);
  // Reuniting a split group gains the most, so those groups go first.
  const apart = ({ members }: (typeof moves)[number]) => members.some((m) => !pins.has(m.id));
  moves.sort((a, b) => Number(apart(b)) - Number(apart(a)));
  // Every move re-runs the flow, whose cost grows with students × projects. The budget keeps a
  // whole school at a few seconds and still searches a single grade to the end. Progress is the
  // share of the budget used, since the search may stop early at a local optimum.
  const budget = Math.ceil(6_000_000 / (students.length * projects.length));
  let used = 0;
  // Seats a group on the target, or releases it when the target is undefined. When the target
  // has no room, the groups pinned there are released as well and returned.
  const place = (from: Map<string, string>, members: Student[], target?: string) => {
    const next = new Map(from);
    for (const m of members) next.delete(m.id);
    const released: typeof moves = [];
    if (target === undefined) return { next, released };
    const max = projectById.get(target)!.maxCapacity;
    if (members.length > max) return null;
    if ([...next.values()].filter((id) => id === target).length + members.length > max) {
      for (const other of moves) {
        if (!other.members.some((m) => next.get(m.id) === target)) continue;
        for (const m of other.members) next.delete(m.id);
        released.push(other);
      }
    }
    for (const m of members) next.set(m.id, target);
    return { next, released };
  };
  search: for (let improved = true; improved;) {
    improved = false;
    for (const { members, targets } of moves) {
      for (const target of targets) {
        if (members.every((m) => pins.get(m.id) === target)) continue;
        const placed = place(pins, members, target);
        if (!placed) continue;
        // A displaced group may also move to another wish, so two groups can swap projects.
        const options = [placed.next];
        for (const other of placed.released) {
          for (const elsewhere of other.targets) {
            if (elsewhere === undefined || elsewhere === target) continue;
            const moved = place(placed.next, other.members, elsewhere);
            if (moved?.released.length === 0) options.push(moved.next);
          }
        }
        for (const next of options) {
          if (used++ === budget) break search;
          const nextSeats = flowAround(students, projects, config, next);
          const nextScore = scoreSeats(students, projects, config, nextSeats);
          onProgress?.(used / budget);
          if (nextScore > score)
            [pins, seats, score, improved] = [next, nextSeats, nextScore, true];
        }
      }
    }
  }
  return { seats, score };
}

/** Keeps the pinned seats and lets the flow place every other student in the room left. */
function flowAround(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
  pins: Map<string, string>,
): Map<string, string> {
  const taken = new Map<string, number>();
  for (const projectId of pins.values()) taken.set(projectId, (taken.get(projectId) ?? 0) + 1);
  const room = projects.map((project) => {
    const used = taken.get(project.id) ?? 0;
    return {
      ...project,
      maxCapacity: Math.max(0, project.maxCapacity - used),
      targetCapacity: Math.max(0, project.targetCapacity - used),
    };
  });
  const seats = flowSeats(
    students.filter((s) => !pins.has(s.id)),
    room,
    config,
  );
  for (const [studentId, projectId] of pins) seats.set(studentId, projectId);
  return seats;
}

/** Min-cost flow over the given students; maps every student that gets a seat to its project. */
function flowSeats(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): Map<string, string> {
  const seats = new Map<string, string>();
  if (students.length === 0) return seats;
  const { mcf, nodeMap, sourceIdx, sinkIdx } = buildAssignmentGraph(students, projects, config);
  mcf.solve(sourceIdx, sinkIdx);
  const studentByNode = new Map([...nodeMap.studentToIdx].map(([id, node]) => [node, id]));
  const projectByNode = new Map([...nodeMap.projectToIdx].map(([id, node]) => [node, id]));
  for (const { from, to } of mcf.getFlows()) {
    const studentId = studentByNode.get(from);
    const projectId = projectByNode.get(to);
    if (studentId !== undefined && projectId !== undefined) seats.set(studentId, projectId);
  }
  return seats;
}

/**
 * Objective of a complete assignment in the flow's cost model, with the sign flipped: priority
 * weights earned, minus the notInTop5, unmatched and over-target penalties, plus the cohesion
 * bonus for each group cluster (same-group students on one project). This is the run score.
 */
function scoreSeats(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
  seats: Map<string, string>,
): number {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const load = new Map<string, number>();
  const clusters = new Map<string, number>();
  let score = 0;
  for (const student of students) {
    const projectId = seats.get(student.id);
    if (projectId === undefined) {
      score -= config.unmatchedPenalty;
      continue;
    }
    load.set(projectId, (load.get(projectId) ?? 0) + 1);
    const rank = priorityRank(student, projectById.get(projectId));
    score += rank === null ? -config.notInTop5Penalty : config.priorityWeights[rank - 1];
    if (student.groupId) {
      const key = JSON.stringify([student.groupId, projectId]);
      clusters.set(key, (clusters.get(key) ?? 0) + 1);
    }
  }
  for (const project of projects) {
    const tier1 = Math.min(project.targetCapacity, project.maxCapacity);
    score -= config.overTargetPenalty * Math.max(0, (load.get(project.id) ?? 0) - tier1);
  }
  for (const size of clusters.values()) score += config.groupCohesionBonus * (size - 1);
  return score;
}
