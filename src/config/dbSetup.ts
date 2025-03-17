import pool from './db';
import fs from 'fs';
import path from 'path';

// Function to create the tables
const createAndSeedDatabase = async () => {
  const connection = await pool.getConnection();

  // Create a DB schema
  const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const exerciseTable = `
    CREATE TABLE IF NOT EXISTS exercises (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      exercise_force VARCHAR(50),
      level VARCHAR(50),
      mechanic VARCHAR(50),
      equipment VARCHAR(100),
      category VARCHAR(50)
    );
  `;
  const primaryMusclesTable = `
    CREATE TABLE IF NOT EXISTS primary_muscles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exercise_id VARCHAR(255),
      muscle VARCHAR(100),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `;
  const secondaryMusclesTable = `
    CREATE TABLE IF NOT EXISTS secondary_muscles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exercise_id VARCHAR(255),
        muscle VARCHAR(100),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `;
  const exerciseInstructionsTable = `
    CREATE TABLE IF NOT EXISTS exercise_instructions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exercise_id VARCHAR(255),
      step_number INT,
      instruction TEXT,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `;
  const exerciseImagesTable = `
    CREATE TABLE IF NOT EXISTS exercise_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exercise_id VARCHAR(255),
      image_url VARCHAR(255),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `;

  const workoutSessionsTable = `
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_time INT,  -- Total workout time in minutes
      comment TEXT,    -- Overall comment for the workout session
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`;

  const workoutExerciseTable = `
    CREATE TABLE IF NOT EXISTS workout_exercise (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        exercise_id VARCHAR(255) NOT NULL,
        sets INT NOT NULL,
        reps INT NOT NULL,
        weight DECIMAL(5,2),
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );`;

  const communityPostTable = `
    CREATE TABLE IF NOT EXISTS community_post (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`;

  try {
    await connection.query(createDatabaseQuery);
    console.log(`Database ${process.env.DB_NAME} created or already exists.`);

    await connection.query(`USE ${process.env.DB_NAME};`);
    console.log(`Using database ${process.env.DB_NAME}.`);

    // Start creating tables
    await connection.query(createUsersTable);
    await connection.query(exerciseTable);
    await connection.query(primaryMusclesTable);
    await connection.query(secondaryMusclesTable);
    await connection.query(exerciseInstructionsTable);
    await connection.query(exerciseImagesTable);
    await connection.query(workoutSessionsTable);
    await connection.query(workoutExerciseTable);
    await connection.query(communityPostTable);

    console.log('Users table created or already exists.');

    const filePath = path.join(__dirname, 'exercises.json');
    const rawData = fs.readFileSync(filePath, 'utf-8'); // JSON file
    const exercises = JSON.parse(rawData); // Parse JSON file

    for (const exercise of exercises) {
      const {
        id,
        name,
        exercise_force,
        level,
        mechanic,
        equipment,
        category,
        primaryMuscles,
        secondaryMuscles,
        instructions,
        images,
      } = exercise;

      // Insert into exercises table
      await connection.query(
        `INSERT INTO exercises (id, name, exercise_force, level, mechanic, equipment, category)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, exercise_force, level, mechanic, equipment, category]
      );

      // Insert primary muscles
      for (const muscle of primaryMuscles) {
        await connection.query(`INSERT INTO primary_muscles (exercise_id, muscle) VALUES (?, ?)`, [
          id,
          muscle,
        ]);
      }

      // Insert secondary muscles
      for (const muscle of secondaryMuscles) {
        await connection.query(
          `INSERT INTO secondary_muscles (exercise_id, muscle) VALUES (?, ?)`,
          [id, muscle]
        );
      }

      // Insert instructions
      for (let i = 0; i < instructions.length; i++) {
        await connection.query(
          `INSERT INTO exercise_instructions (exercise_id, step_number, instruction) VALUES (?, ?, ?)`,
          [id, i + 1, instructions[i]]
        );
      }

      // Insert images
      for (const image of images) {
        await connection.query(
          `INSERT INTO exercise_images (exercise_id, image_url) VALUES (?, ?)`,
          [id, image]
        );
      }
    }
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error creating or seeding tables:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
};

// Run the database setup
createAndSeedDatabase()
  .then(() => {
    console.log('Database setup completed successfully!');
  })
  .catch((err) => {
    console.error('Database setup failed:', err);
    process.exit(1); // Exit with an error code if the setup fails
  });
