import express from "express";
import { Request, Response } from "express-serve-static-core";
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import pool from './config/db';
import path from 'path';
import ejsLayouts from 'express-ejs-layouts';
import { authenticate } from './middlewares/authenticate';
import { ExerciseController } from './controllers/exerciseController';
import { ResultSetHeader } from 'mysql2';
import { User } from './models/User';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import { FoodController } from "./controllers/FoodController";



dotenv.config();

const app = express();

// Ensure the database is selected for each query
const selectDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    // Switch to the correct database on every new connection
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} selected successfully.`);
  } catch (error) {
    console.error('Error selecting database:', error);
    throw error; // Stop execution if selecting the database fails
  } finally {
    connection.release(); // Release the connection after selecting the database
  }
};

// Middleware for parsing request body
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form-encoded data
app.use(cors());

// Middleware to ensure the database is selected for every request
app.use(async (req, res, next) => {
  try {
    // Select the database before proceeding with the request
    await selectDatabase();
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Database selection failed:', error);
    res.status(500).json({ message: 'Database selection failed' });
  }
});

// Static Files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/image', express.static(path.join(__dirname, '../public/images')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Register routes
app.use('/auth', authRoutes);

// Set Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.set("base", "./base.ejs");
app.get('/', (req, res) => {
  res.render('index', {
    layout: false,
  });
});


// Register routes with authentication middleware
app.get("/foods", authenticate, (req, res) => FoodController.getFoods(req, res));
app.post("/foods/:foodId", authenticate, (req, res) => FoodController.addFoodToMealLog(req, res));
app.delete("/remove-food/:foodId", authenticate, async (req, res) => {
  await FoodController.removeFood(req, res);
});

// --------------------------------------------------------------------------------------------

app.get('/signup', (req, res) => {
  res.render('signup', { layout: false });
});
app.get('/login', (req, res) => {
  res.render("login", { layout: false });
});
app.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    // Fetch user from DB
    let [user] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);
    user = user as ResultSetHeader[];
    if (!user.length) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const currentUser = user[0] as unknown as User;
    const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
    if (!validPassword) {
      res.status(400).json({ success: false, message: "Current password is incorrect." });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
app.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.redirect('/'); // Redirect to the home or index page
});

app.get('/dashboard', authenticate, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    layout: 'layout.ejs',
    user: req.user,
  });
});
app.get('/profile', authenticate, (req, res) => {
  res.render('profile', {
    title: 'Profile',
    layout: 'layout.ejs',
    user: req.user,
  });
});
app.get('/exercises', authenticate, (req, res) => ExerciseController.getExercises(req, res));
app.post('/bmi', authenticate, (req, res) => ExerciseController.bmiCalculate(req, res));
app.post('/workout/history', authenticate, (req, res) =>
  ExerciseController.createWorkoutHistory(req, res)
);
app.get('/workout/history', authenticate, (req, res) =>
  ExerciseController.workoutHistory(req, res)
);
app.post('/community/post', authenticate, async (req, res) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) {
    res.status(400).json({ message: 'User ID and content are required.' });
    return;
  }

  const query = `
      INSERT INTO community_post (user_id, content)
      VALUES (?, ?);
  `;

  try {
    await pool.query(query, [user_id, content]);
    res.json({ message: 'Post created successfully!' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/community/posts', async (req, res) => {
  const query = `
      SELECT p.id, p.content, p.created_at, u.username 
      FROM community_post p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC;
  `;

  try {
    const [posts] = await pool.query(query);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
const startServer = async () => {
  try {
    // Ensure database selection at the start
    await selectDatabase();

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1); // Exit the process if database selection fails
  }
};

// Start the server
startServer();
