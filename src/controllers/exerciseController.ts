import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';

export class ExerciseController {
  static async getExercises(req: Request, res: Response) {
    try {
      const result = await ExerciseService.getExercises(req);
      res.json(result);
    } catch (error: any) {
      res.status(500).send('Error fetching exercises');
    }
  }

  static async bmiCalculate(req: Request, res: Response) {
    try {
      const result = await ExerciseService.bmiCalculator(req);
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message || 'Error fetching exercises');
    }
  }

  static async createWorkoutHistory(req: Request, res: Response) {
    try {
      const result = await ExerciseService.createWorkoutHistory(req);
      res.json({ message: 'Workout history added successfully', id: result });
    } catch (error: any) {
      res.status(500).send(error.message || 'Error adding history');
    }
  }

  static async workoutHistory(req: Request, res: Response) {
    try {
      const result = await ExerciseService.workoutHistory(req);
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message || 'Error fetching history');
    }
  }
}
