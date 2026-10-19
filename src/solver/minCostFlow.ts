import type { Edge } from './types';

const INF = Number.MAX_SAFE_INTEGER / 2;

/**
 * Min-cost max-flow by primal-dual augmentation. Each phase runs Dijkstra on reduced costs,
 * moves the potentials, and then pushes a maximum flow through the zero-reduced-cost edges,
 * so a phase covers many unit augmentations. Costs must be integers, and the graph must not
 * contain a negative cycle.
 */
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
    // Exact zero tests on reduced costs need integer arithmetic.
    if (!Number.isInteger(cost)) throw new RangeError(`Edge cost must be an integer, got ${cost}`);
    const e1: Edge = {
      from,
      to,
      capacity,
      cost,
      flow: 0,
      reverse: this.edges.length + 1,
    };
    const e2: Edge = {
      from: to,
      to: from,
      capacity: 0,
      cost: -cost,
      flow: 0,
      reverse: this.edges.length,
    };
    this.graph[from].push(this.edges.length);
    this.edges.push(e1);
    this.graph[to].push(this.edges.length);
    this.edges.push(e2);
  }

  solve(source: number, sink: number): { totalFlow: number; totalCost: number } {
    const potential = this.initialPotentials();
    const dist = new Array<number>(this.n);
    let totalFlow = 0;
    let totalCost = 0;
    while (true) {
      const sinkDist = this.reducedDistances(source, sink, potential, dist);
      if (sinkDist === INF) break;
      // Capping at the sink distance keeps every residual reduced cost non-negative.
      for (let v = 0; v < this.n; v++) potential[v] += Math.min(dist[v], sinkDist);
      const pushed = this.pushAdmissible(source, sink, potential);
      totalFlow += pushed;
      totalCost += pushed * (potential[sink] - potential[source]);
    }
    return { totalFlow, totalCost };
  }

  getFlows(): Array<{ from: number; to: number; flow: number; cost: number }> {
    return this.edges
      .filter((e) => e.flow > 0 && e.capacity > 0)
      .map((e) => ({ from: e.from, to: e.to, flow: e.flow, cost: e.cost }));
  }

  /** Shortest distances from a virtual node linked to every node (Bellman-Ford with a queue). */
  private initialPotentials(): number[] {
    const potential = new Array<number>(this.n).fill(0);
    const queue = Array.from({ length: this.n }, (_, node) => node);
    const queued = new Array<boolean>(this.n).fill(true);
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      queued[node] = false;
      for (const eIdx of this.graph[node]) {
        const e = this.edges[eIdx];
        if (e.capacity - e.flow <= 0) continue;
        const candidate = potential[node] + e.cost;
        if (candidate < potential[e.to]) {
          potential[e.to] = candidate;
          if (!queued[e.to]) {
            queued[e.to] = true;
            queue.push(e.to);
          }
        }
      }
    }
    return potential;
  }

  /**
   * Dijkstra on reduced costs, stopped once the sink is settled. Unsettled nodes keep tentative
   * values of at least the sink distance, which is what the potential update relies on.
   */
  private reducedDistances(
    source: number,
    sink: number,
    potential: number[],
    dist: number[],
  ): number {
    dist.fill(INF);
    dist[source] = 0;
    const heap = new MinHeap();
    heap.push(0, source);
    while (heap.size > 0) {
      const { key, node } = heap.pop();
      if (key > dist[node]) continue;
      if (node === sink) break;
      for (const eIdx of this.graph[node]) {
        const e = this.edges[eIdx];
        if (e.capacity - e.flow <= 0) continue;
        const reduced = key + e.cost + potential[node] - potential[e.to];
        if (reduced < dist[e.to]) {
          dist[e.to] = reduced;
          heap.push(reduced, e.to);
        }
      }
    }
    return dist[sink];
  }

  /** Dinic-style maximum flow restricted to edges with zero reduced cost. */
  private pushAdmissible(source: number, sink: number, potential: number[]): number {
    const level = new Array<number>(this.n);
    const next = new Array<number>(this.n);
    let pushed = 0;
    while (this.buildLevels(source, sink, potential, level)) {
      next.fill(0);
      let f = this.augmentPath(source, sink, potential, level, next);
      while (f > 0) {
        pushed += f;
        f = this.augmentPath(source, sink, potential, level, next);
      }
    }
    return pushed;
  }

  private buildLevels(source: number, sink: number, potential: number[], level: number[]): boolean {
    level.fill(-1);
    level[source] = 0;
    const queue = [source];
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      for (const eIdx of this.graph[node]) {
        const e = this.edges[eIdx];
        if (
          level[e.to] < 0 &&
          e.capacity - e.flow > 0 &&
          e.cost + potential[node] - potential[e.to] === 0
        ) {
          level[e.to] = level[node] + 1;
          queue.push(e.to);
        }
      }
    }
    return level[sink] >= 0;
  }

  /** Finds one augmenting path in the level graph (iterative DFS) and pushes its bottleneck. */
  private augmentPath(
    source: number,
    sink: number,
    potential: number[],
    level: number[],
    next: number[],
  ): number {
    const path: number[] = [];
    let node = source;
    for (;;) {
      if (node === sink) {
        let f = INF;
        for (const eIdx of path) f = Math.min(f, this.edges[eIdx].capacity - this.edges[eIdx].flow);
        for (const eIdx of path) {
          const e = this.edges[eIdx];
          e.flow += f;
          this.edges[e.reverse].flow -= f;
        }
        return f;
      }
      const adjacent = this.graph[node];
      let advanced = false;
      while (next[node] < adjacent.length) {
        const eIdx = adjacent[next[node]];
        const e = this.edges[eIdx];
        if (
          e.capacity - e.flow > 0 &&
          level[e.to] === level[node] + 1 &&
          e.cost + potential[node] - potential[e.to] === 0
        ) {
          path.push(eIdx);
          node = e.to;
          advanced = true;
          break;
        }
        next[node]++;
      }
      if (!advanced) {
        if (path.length === 0) return 0;
        level[node] = -1;
        node = this.edges[path.pop()!].from;
        next[node]++;
      }
    }
  }
}

/** Binary min-heap of (key, node) pairs. Callers skip stale entries. */
class MinHeap {
  private keys: number[] = [];
  private nodes: number[] = [];

  get size(): number {
    return this.keys.length;
  }

  push(key: number, node: number): void {
    const { keys, nodes } = this;
    let i = keys.length;
    keys.push(key);
    nodes.push(node);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (keys[parent] <= key) break;
      keys[i] = keys[parent];
      nodes[i] = nodes[parent];
      i = parent;
    }
    keys[i] = key;
    nodes[i] = node;
  }

  pop(): { key: number; node: number } {
    const { keys, nodes } = this;
    const top = { key: keys[0], node: nodes[0] };
    const lastKey = keys.pop()!;
    const lastNode = nodes.pop()!;
    const size = keys.length;
    if (size > 0) {
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= size) break;
        if (child + 1 < size && keys[child + 1] < keys[child]) child++;
        if (keys[child] >= lastKey) break;
        keys[i] = keys[child];
        nodes[i] = nodes[child];
        i = child;
      }
      keys[i] = lastKey;
      nodes[i] = lastNode;
    }
    return top;
  }
}
