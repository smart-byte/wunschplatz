import { describe, it, expect } from 'vitest';
import { buildAssignmentGraph } from '@/solver/buildGraph';
import type { Project, SolverConfig, Student } from '@/types';

// Mulberry32: a small seeded generator keeps the random instances reproducible.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Instance = { students: Student[]; projects: Project[]; config: SolverConfig };

function randomInstance(random: () => number): Instance {
  const int = (lo: number, hi: number) => lo + Math.floor(random() * (hi - lo + 1));
  const grades = [5, 6, 7];
  const projectCount = int(1, 3);
  const projects: Project[] = Array.from({ length: projectCount }, (_, i) => {
    const maxCapacity = int(0, 3);
    return {
      id: `p${i}`,
      name: `P${i}`,
      grades: grades.filter(() => random() < 0.6),
      maxCapacity,
      targetCapacity: int(0, maxCapacity + 1),
    };
  });
  const students: Student[] = Array.from({ length: int(0, 5) }, (_, i) => {
    const grade = grades[int(0, grades.length - 1)];
    const priorities = Array.from({ length: int(0, 7) }, () =>
      random() < 0.15 ? 'unknown' : `p${int(0, projectCount - 1)}`,
    );
    return {
      id: `s${i}`,
      firstName: `S${i}`,
      lastName: 'X',
      className: `${grade}a`,
      grade,
      priorities,
    };
  });
  const config: SolverConfig = {
    priorityWeights: [10, 6, 3, 2, 1],
    unmatchedPenalty: int(5, 1000),
    overTargetPenalty: int(0, 5),
    notInTop5Penalty: int(0, 60),
    groupCohesionBonus: 0,
  };
  return { students, projects, config };
}

/** Cheapest flow-model edge cost from a student to a project, or undefined when there is none. */
function edgeCost(student: Student, project: Project, config: SolverConfig): number | undefined {
  if (!project.grades.includes(student.grade)) return undefined;
  let wished: number | undefined;
  student.priorities.slice(0, 5).forEach((id, k) => {
    if (id !== project.id) return;
    const cost = -config.priorityWeights[k];
    wished = wished === undefined ? cost : Math.min(wished, cost);
  });
  return wished ?? config.notInTop5Penalty;
}

function bruteForceMinCost({ students, projects, config }: Instance): number {
  const choices = students.map((student) => {
    const options: Array<{ project: number; cost: number }> = [
      { project: -1, cost: config.unmatchedPenalty },
    ];
    projects.forEach((project, index) => {
      const cost = edgeCost(student, project, config);
      if (cost !== undefined) options.push({ project: index, cost });
    });
    return options;
  });
  const load = projects.map(() => 0);
  let best = Infinity;
  const search = (index: number, cost: number): void => {
    if (index === students.length) {
      let total = cost;
      for (let p = 0; p < projects.length; p++) {
        if (load[p] > projects[p].maxCapacity) return;
        const tier1 = Math.min(projects[p].targetCapacity, projects[p].maxCapacity);
        total += config.overTargetPenalty * Math.max(0, load[p] - tier1);
      }
      best = Math.min(best, total);
      return;
    }
    for (const option of choices[index]) {
      if (option.project >= 0) load[option.project]++;
      search(index + 1, cost + option.cost);
      if (option.project >= 0) load[option.project]--;
    }
  };
  search(0, 0);
  return best;
}

describe('buildAssignmentGraph flow cost', () => {
  it('matches the brute-force minimum on tiny random instances', () => {
    const random = seededRandom(20261018);
    for (let iteration = 0; iteration < 300; iteration++) {
      const instance = randomInstance(random);
      const { mcf, sourceIdx, sinkIdx } = buildAssignmentGraph(
        instance.students,
        instance.projects,
        instance.config,
      );
      const { totalFlow, totalCost } = mcf.solve(sourceIdx, sinkIdx);
      expect(totalFlow, `instance ${iteration}`).toBe(instance.students.length);
      expect(totalCost, `instance ${iteration}`).toBe(bruteForceMinCost(instance));
    }
  });
});
