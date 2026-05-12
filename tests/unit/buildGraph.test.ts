import { describe, it, expect } from 'vitest';
import { buildAssignmentGraph } from '@/solver/buildGraph';
import { defaultSolverConfig } from '@/types';
import type { Project, Student } from '@/types';

const project = (id: string, grades: number[], max: number, target: number): Project => ({
  id, name: `P-${id}`, grades, maxCapacity: max, targetCapacity: target,
});

const student = (id: string, grade: number, priorities: string[]): Student => ({
  id, firstName: `S${id}`, lastName: 'X', className: '7a', grade, priorities,
});

describe('buildAssignmentGraph', () => {
  it('returns a graph with correct node mapping', () => {
    const projects = [project('a', [7], 10, 8), project('b', [7], 5, 4)];
    const students = [student('s1', 7, ['a', 'b'])];
    const { nodeMap, nodeCount, sourceIdx, sinkIdx } = buildAssignmentGraph(
      students, projects, defaultSolverConfig,
    );
    expect(nodeCount).toBe(5);
    expect(sourceIdx).toBe(0);
    expect(sinkIdx).toBe(1);
    expect(nodeMap.studentToIdx.get('s1')).toBe(2);
    expect(nodeMap.projectToIdx.get('a')).toBe(3);
    expect(nodeMap.projectToIdx.get('b')).toBe(4);
  });

  it('adds edges for top5 priorities with grade compatibility', () => {
    const projects = [project('a', [7], 10, 8)];
    const students = [student('s1', 7, ['a'])];
    const { mcf, nodeMap } = buildAssignmentGraph(students, projects, defaultSolverConfig);
    expect(mcf).toBeDefined();
    const result = mcf.solve(0, 1);
    expect(result.totalFlow).toBe(1);
    const flows = mcf.getFlows();
    const studentIdx = nodeMap.studentToIdx.get('s1')!;
    const projectIdx = nodeMap.projectToIdx.get('a')!;
    const flow = flows.find((f) => f.from === studentIdx && f.to === projectIdx);
    expect(flow?.flow).toBe(1);
  });

  it('respects grade restrictions', () => {
    const projects = [project('a', [5], 10, 8), project('b', [7], 10, 8)];
    const students = [student('s1', 7, ['a', 'b'])];
    const { mcf, nodeMap } = buildAssignmentGraph(students, projects, defaultSolverConfig);
    mcf.solve(0, 1);
    const flows = mcf.getFlows();
    const sIdx = nodeMap.studentToIdx.get('s1')!;
    const aIdx = nodeMap.projectToIdx.get('a')!;
    const bIdx = nodeMap.projectToIdx.get('b')!;
    expect(flows.find((f) => f.from === sIdx && f.to === aIdx)).toBeUndefined();
    expect(flows.find((f) => f.from === sIdx && f.to === bIdx)?.flow).toBe(1);
  });

  it('assigns both students when target=1, max=2 across two projects', () => {
    const projects = [project('a', [7], 2, 1), project('b', [7], 2, 1)];
    const students = [
      student('s1', 7, ['a']),
      student('s2', 7, ['a']),
    ];
    const { mcf, nodeMap } = buildAssignmentGraph(students, projects, defaultSolverConfig);
    mcf.solve(0, 1);
    const flows = mcf.getFlows();
    const aIdx = nodeMap.projectToIdx.get('a')!;
    const bIdx = nodeMap.projectToIdx.get('b')!;
    const aFlow = flows.filter((f) => f.to === aIdx).reduce((s, f) => s + f.flow, 0);
    const bFlow = flows.filter((f) => f.to === bIdx).reduce((s, f) => s + f.flow, 0);
    expect(aFlow + bFlow).toBe(2);
  });
});
