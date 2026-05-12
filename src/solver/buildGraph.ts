import { MinCostFlow } from './minCostFlow';
import type { Project, Student, SolverConfig } from '@/types';

export type NodeMap = {
  studentToIdx: Map<string, number>;
  projectToIdx: Map<string, number>;
};

export type GraphBuildResult = {
  mcf: MinCostFlow;
  nodeMap: NodeMap;
  nodeCount: number;
  sourceIdx: number;
  sinkIdx: number;
};

export function buildAssignmentGraph(
  students: Student[],
  projects: Project[],
  config: SolverConfig,
): GraphBuildResult {
  const sourceIdx = 0;
  const sinkIdx = 1;
  const studentBase = 2;
  const projectBase = 2 + students.length;
  const nodeCount = projectBase + projects.length;

  const studentToIdx = new Map<string, number>();
  const projectToIdx = new Map<string, number>();
  students.forEach((s, i) => studentToIdx.set(s.id, studentBase + i));
  projects.forEach((p, i) => projectToIdx.set(p.id, projectBase + i));

  const mcf = new MinCostFlow(nodeCount);

  // Source → Student
  for (const s of students) {
    mcf.addEdge(sourceIdx, studentToIdx.get(s.id)!, 1, 0);
  }

  // Student → Project edges
  for (const s of students) {
    const sIdx = studentToIdx.get(s.id)!;
    const priorityIds = new Set<string>();

    s.priorities.forEach((projId, k) => {
      if (k >= 5) return;
      const project = projects.find((p) => p.id === projId);
      if (!project) return;
      if (!project.grades.includes(s.grade)) return;
      priorityIds.add(projId);
      const pIdx = projectToIdx.get(projId)!;
      mcf.addEdge(sIdx, pIdx, 1, -config.priorityWeights[k]);
    });

    for (const p of projects) {
      if (priorityIds.has(p.id)) continue;
      if (!p.grades.includes(s.grade)) continue;
      const pIdx = projectToIdx.get(p.id)!;
      mcf.addEdge(sIdx, pIdx, 1, config.notInTop5Penalty);
    }

    mcf.addEdge(sIdx, sinkIdx, 1, config.unmatchedPenalty);
  }

  // Project → Sink (tiered)
  for (const p of projects) {
    const pIdx = projectToIdx.get(p.id)!;
    const tier1 = Math.min(p.targetCapacity, p.maxCapacity);
    const tier2 = Math.max(0, p.maxCapacity - tier1);
    if (tier1 > 0) mcf.addEdge(pIdx, sinkIdx, tier1, 0);
    if (tier2 > 0) mcf.addEdge(pIdx, sinkIdx, tier2, config.overTargetPenalty);
  }

  return {
    mcf,
    nodeMap: { studentToIdx, projectToIdx },
    nodeCount,
    sourceIdx,
    sinkIdx,
  };
}
