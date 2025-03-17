import { Exercise } from './Exercise';

export interface WorkoutSession {
  workout_name: string;
  created_at: string;
  total_time?: number;
  comment?: string;
  exercises: Exercise[];
}
