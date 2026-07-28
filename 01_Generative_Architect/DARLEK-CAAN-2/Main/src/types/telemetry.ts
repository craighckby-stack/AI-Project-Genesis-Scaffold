export type Agent = {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  mass: number;
};

export type WorldState = {
  dimensions: { width: number; height: number };
  gravityConstant: number;
  timestamp: number;
};



