export type Edge = {
  from: number;
  to: number;
  capacity: number;
  cost: number;
  flow: number;
  reverse: number;
};

export type FlowResult = {
  totalFlow: number;
  totalCost: number;
};
