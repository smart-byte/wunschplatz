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
    const mcf = new MinCostFlow(4);
    mcf.addEdge(0, 1, 2, 1);
    mcf.addEdge(0, 2, 2, 5);
    mcf.addEdge(1, 3, 1, 0);
    mcf.addEdge(2, 3, 1, 0);
    const result = mcf.solve(0, 3);
    expect(result.totalFlow).toBe(2);
    expect(result.totalCost).toBe(6);
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

  it('handles a no-feasible-flow scenario gracefully', () => {
    const mcf = new MinCostFlow(4);
    mcf.addEdge(0, 1, 2, 0);
    mcf.addEdge(1, 2, 1, 0);
    mcf.addEdge(2, 3, 1, 0);
    const result = mcf.solve(0, 3);
    expect(result.totalFlow).toBe(1);
  });
});
