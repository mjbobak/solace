export type SankeyViewMode = 'top-level' | 'detailed';
export type SankeyPeriod = 'monthly' | 'annual';

export interface SankeyNode {
  name: string;
  fill?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
