export const DOMAINS = {
  'edge-ai': 'Edge AI',
  'robot-learning': 'Robot learning',
  'pcb': 'PCB and hardware',
  'cad': 'CAD and mechanical',
  'other': 'Language models',
} as const;
export type Domain = keyof typeof DOMAINS;
