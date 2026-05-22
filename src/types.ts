export type Project = {
  id: string;
  name: string;
  description?: string;
  grades: number[];
  maxCapacity: number;
  targetCapacity: number;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  grade: number;
  priorities: string[];
  groupId?: string;  // optional group membership
};

export type Assignment = {
  studentId: string;
  projectId: string | null;
  priorityRank: number | null;
  manuallyEdited: boolean;
};

export type SolverConfig = {
  priorityWeights: [number, number, number, number, number];
  unmatchedPenalty: number;
  overTargetPenalty: number;
  notInTop5Penalty: number;
  groupCohesionBonus: number;
};

export const defaultSolverConfig: SolverConfig = {
  priorityWeights: [10, 6, 3, 2, 1],
  unmatchedPenalty: 1000,
  overTargetPenalty: 2,
  notInTop5Penalty: 50,
  groupCohesionBonus: 8,
};

export type SolverStats = {
  totalStudents: number;
  assignedByPriority: [number, number, number, number, number];
  notInTop5: number;
  unassigned: number;
};

export type SolverRun = {
  timestamp: number;
  config: SolverConfig;
  score: number;
  stats: SolverStats;
};

export type AssignmentsState = {
  assignments: Assignment[];
  lastRun: SolverRun | null;
};

export type Distribution = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  assignments: Assignment[];
  run: SolverRun;
};
