import { describe, it, expect } from 'vitest';
import { MinCostFlow } from '@/solver/minCostFlow';

describe('MinCostFlow', () => {
  it('finds min cost flow on simple graph', () => {
    const mcf = new MinCostFlow(4);
    mcf.addEdge(0, 1, 1, 1);
    mcf.addEdge(0, 2, 1, 2);
    mcf.addEdge(1, 3, 1, 0);
    mcf.addEdge(2, 3, 1, 0);
    const result = mcf.solve(0, 3);
    expect(result.totalFlow).toBe(2);
    expect(result.totalCost).toBe(3);
  });

  it('prefers cheaper path when alternatives exist', () => {
    const mcf = new MinCostFlow(5);
    mcf.addEdge(0, 1, 1, 5);
    mcf.addEdge(0, 2, 1, 1);
    mcf.addEdge(1, 3, 1, 0);
    mcf.addEdge(2, 3, 1, 0);
    mcf.addEdge(3, 4, 1, 0);
    expect(mcf.solve(0, 4)).toEqual({ totalFlow: 1, totalCost: 1 });
    expect(mcf.getFlows()).not.toContainEqual(expect.objectContaining({ from: 0, to: 1 }));
  });

  it('handles negative costs', () => {
    const mcf = new MinCostFlow(3);
    mcf.addEdge(0, 1, 1, -5);
    mcf.addEdge(1, 2, 1, 0);
    const result = mcf.solve(0, 2);
    expect(result.totalFlow).toBe(1);
    expect(result.totalCost).toBe(-5);
  });

  it('flows are recoverable per edge', () => {
    const mcf = new MinCostFlow(3);
    mcf.addEdge(0, 1, 1, 0);
    mcf.addEdge(1, 2, 1, 0);
    mcf.solve(0, 2);
    const flows = mcf.getFlows();
    const flow01 = flows.find((f) => f.from === 0 && f.to === 1);
    expect(flow01?.flow).toBe(1);
  });

  it('limits flow to the smallest capacity on the path', () => {
    const mcf = new MinCostFlow(4);
    mcf.addEdge(0, 1, 2, 0);
    mcf.addEdge(1, 2, 1, 0);
    mcf.addEdge(2, 3, 1, 0);
    const result = mcf.solve(0, 3);
    expect(result.totalFlow).toBe(1);
  });

  it('returns zero flow when the sink is unreachable', () => {
    const mcf = new MinCostFlow(3);
    mcf.addEdge(0, 1, 1, 0);
    expect(mcf.solve(0, 2)).toEqual({ totalFlow: 0, totalCost: 0 });
  });

  it('reroutes an earlier choice to find the cheapest complete assignment', () => {
    const mcf = new MinCostFlow(6);
    mcf.addEdge(0, 1, 1, 0);
    mcf.addEdge(0, 2, 1, 0);
    mcf.addEdge(1, 3, 1, -10);
    mcf.addEdge(1, 4, 1, -6);
    mcf.addEdge(2, 3, 1, -9);
    mcf.addEdge(2, 4, 1, 0);
    mcf.addEdge(3, 5, 1, 0);
    mcf.addEdge(4, 5, 1, 0);
    expect(mcf.solve(0, 5)).toEqual({ totalFlow: 2, totalCost: -15 });
    expect(mcf.getFlows()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 1, to: 4, flow: 1 }),
        expect.objectContaining({ from: 2, to: 3, flow: 1 }),
      ]),
    );
  });
});
