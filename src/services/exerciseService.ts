import { Request } from 'express';
import pool from '../config/db';
import { WorkoutSession } from '../models/WorkoutSession';
import { ResultSetHeader } from 'mysql2';

export class ExerciseService {
  static async getExercises(req: Request) {
    let { level, category, exerciseType } = req.query;
    level = level?.toString()?.toLowerCase();
    category = category?.toString()?.toLowerCase();
    exerciseType = exerciseType?.toString()?.toLowerCase();

    let query = `
      SELECT 
      e.id, 
      e.name, 
      e.exercise_force, 
      e.level, 
      e.mechanic, 
      e.equipment, 
      e.category,
      COALESCE(GROUP_CONCAT(DISTINCT pm.muscle SEPARATOR ', '), '') AS primaryMuscles,
      COALESCE(GROUP_CONCAT(DISTINCT sm.muscle SEPARATOR ', '), '') AS secondaryMuscles,
      COALESCE(GROUP_CONCAT(DISTINCT ei.instruction ORDER BY ei.step_number SEPARATOR '|'), '') AS instructions
      FROM exercises e
      LEFT JOIN primary_muscles pm ON e.id = pm.exercise_id
      LEFT JOIN secondary_muscles sm ON e.id = sm.exercise_id
      LEFT JOIN exercise_instructions ei ON e.id = ei.exercise_id
      WHERE 1=1
    `;

    // Add filters to the query
    if (level) {
      query += ` AND e.level = '${level}'`;
    }
    if (category) {
      query += ` AND e.category = '${category}'`;
    }
    if (exerciseType) {
      query += ` AND e.exercise_force = '${exerciseType}'`;
    }

    query += ` GROUP BY e.id, e.name, e.exercise_force, e.level, e.mechanic, e.equipment, e.category
    ORDER BY e.name;`;
    const [results] = await pool.query(query);
    return results;
  }

  static async bmiCalculator(req: Request) {
    const { weight, feet, inches } = req.body;

    if (!weight || !feet || inches <= 0) {
      new Error('Invalid weight or height');
    }

    const height = feet * 0.3048 + inches * 0.0254;

    // Calculate BMI
    const bmi = Number((weight / (height * height)).toFixed(2));

    // Determine BMI Category
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 18.5 && bmi < 24.9) category = 'Normal weight';
    else if (bmi >= 25 && bmi < 29.9) category = 'Overweight';
    else category = 'Obese';
    return { category, bmi };
  }

  static async createWorkoutHistory(req: Request) {
    const user_id = req.user?.id;
    const { total_time, comment, exercises } = req.body;

    if (!user_id || !exercises || exercises.length === 0) {
      return new Error('Missing required fields');
    }

    // Insert into workout_sessions table
    const sessionQuery = `
        INSERT INTO workout_sessions (user_id, total_time, comment) 
        VALUES (${user_id}, ${total_time}, '${comment}')
    `;

    let [session] = await pool.query(sessionQuery);
    session = session as ResultSetHeader;
    const session_id = session.insertId;
    exercises.map(async (ex: any) => {
      const exerciseQuery = `
        INSERT INTO workout_exercise (session_id, exercise_id, sets, reps, weight)
        VALUES (${session_id}, '${ex.exercise_id}', ${ex.sets}, ${ex.reps}, ${ex.weight})
      `;
      await pool.query(exerciseQuery);
    });
    return;
  }

  static async workoutHistory(req: Request) {
    const id = req.user?.id;
    let query = `
    SELECT ws.id AS session_id, ws.total_time, ws.comment, ws.created_at,
           we.exercise_id, e.name AS exercise_name, we.sets, we.reps, we.weight
    FROM workout_sessions ws
    JOIN workout_exercise we ON ws.id = we.session_id
    JOIN exercises e ON we.exercise_id = e.id
  `;

    query += ` WHERE ws.user_id = ${id}`;
    query += ` ORDER BY ws.created_at DESC;`;

    const [results] = await pool.query(query);
    const history: Record<string, WorkoutSession> = {};
    const resultArray = results as any[];
    resultArray.forEach((row) => {
      if (!history[row.session_id]) {
        history[row.session_id] = {
          workout_name: row.workout_name,
          total_time: row.total_time,
          comment: row.comment,
          created_at: row.created_at,
          exercises: [],
        };
      }
      history[row.session_id].exercises.push({
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
      });
    });
    return Object.values(history);
  }
}
