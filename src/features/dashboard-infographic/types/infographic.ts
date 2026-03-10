/**
 * Core types for the dashboard infographic feature
 */

export type Period = 'monthly' | 'annual';

export interface AnimationConfig {
  triggerOnce: boolean;
  threshold: number;
  duration: number;
  delay?: number;
}

export interface InfographicProps {
  period: Period;
}
