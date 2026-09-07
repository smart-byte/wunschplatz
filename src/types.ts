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
  groupId?: string;
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
  kind?: 'solver' | 'manual';
  inputSignature?: string;
  timestamp: number;
  config: SolverConfig;
  score: number;
  stats: SolverStats;
};

export type Distribution = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  assignments: Assignment[];
  run: SolverRun;
};

export type RoundStatus = 'active' | 'idle';

export type RoundPhase = 'planned' | 'running' | 'completed';

export type BlueprintOption = { projectId: string; label: string };

export type BlueprintQuestion = {
  key:
    | 'firstName'
    | 'lastName'
    | 'className'
    | 'grade'
    | 'priority1'
    | 'priority2'
    | 'priority3'
    | 'priority4'
    | 'priority5';
  title: string; // exact text → becomes the exported CSV column header
  type: 'short_text' | 'choice' | 'dropdown';
  options?: string[];
  required: boolean;
};

export type FormBlueprint = {
  prioritiesCount: number;
  identity: BlueprintQuestion[];
  priorities: BlueprintQuestion[];
  projectOptions: BlueprintOption[];
  generatedAt: string;
};

export type RoundData = {
  projects: Project[];
  students: Student[];
  groupColors: Record<string, string>;
  distributions: Distribution[];
  distributionActiveId: string | null;
  solverConfig: SolverConfig;
};

export type Round = {
  id: string;
  name: string;
  createdAt: string; // ISO
  status: RoundStatus;
  phase?: RoundPhase; // absent = legacy round, read as 'running'
  blueprint?: FormBlueprint;
  blueprintHistory?: FormBlueprint[];
  // The selected round lives in the working stores; other rounds carry snapshots.
  data?: RoundData;
};
