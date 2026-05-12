import type { Edge } from './types';

const INF = Number.MAX_SAFE_INTEGER / 2;

export class MinCostFlow {
  private n: number;
  private graph: number[][];
  private edges: Edge[];

  constructor(n: number) {
    this.n = n;
    this.graph = Array.from({ length: n }, () => []);
    this.edges = [];
  }

  addEdge(from: number, to: number, capacity: number, cost: number): void {
    const e1: Edge = {
      from, to, capacity, cost, flow: 0,
      reverse: this.edges.length + 1,
    };
    const e2: Edge = {
      from: to, to: from, capacity: 0, cost: -cost, flow: 0,
      reverse: this.edges.length,
    };
    this.graph[from].push(this.edges.length);
    this.edges.push(e1);
    this.graph[to].push(this.edges.length);
    this.edges.push(e2);
  }

  private spfa(source: number): { dist: number[]; prevEdge: number[] } {
    const dist = new Array(this.n).fill(INF);
    const inQueue = new Array(this.n).fill(false);
    const prevEdge = new Array(this.n).fill(-1);
    dist[source] = 0;
    const queue: number[] = [source];
    inQueue[source] = true;
    while (queue.length > 0) {
      const u = queue.shift()!;
      inQueue[u] = false;
      for (const eIdx of this.graph[u]) {
        const e = this.edges[eIdx];
        if (e.capacity - e.flow > 0 && dist[u] + e.cost < dist[e.to]) {
          dist[e.to] = dist[u] + e.cost;
          prevEdge[e.to] = eIdx;
          if (!inQueue[e.to]) {
            queue.push(e.to);
            inQueue[e.to] = true;
          }
        }
      }
    }
    return { dist, prevEdge };
  }

  solve(source: number, sink: number): { totalFlow: number; totalCost: number } {
    let totalFlow = 0;
    let totalCost = 0;
    while (true) {
      const { dist, prevEdge } = this.spfa(source);
      if (dist[sink] === INF) break;
      let pushFlow = INF;
      for (let v = sink; v !== source; ) {
        const e = this.edges[prevEdge[v]];
        pushFlow = Math.min(pushFlow, e.capacity - e.flow);
        v = e.from;
      }
      for (let v = sink; v !== source; ) {
        const e = this.edges[prevEdge[v]];
        e.flow += pushFlow;
        this.edges[e.reverse].flow -= pushFlow;
        v = e.from;
      }
      totalFlow += pushFlow;
      totalCost += pushFlow * dist[sink];
    }
    return { totalFlow, totalCost };
  }

  getFlows(): Array<{ from: number; to: number; flow: number; cost: number }> {
    return this.edges
      .filter((e) => e.flow > 0 && e.capacity > 0)
      .map((e) => ({ from: e.from, to: e.to, flow: e.flow, cost: e.cost }));
  }
}
