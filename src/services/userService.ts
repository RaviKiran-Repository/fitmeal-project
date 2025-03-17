import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

export class UserService {
  static async registerUser(username: string, email: string, password: string) {
    username = username.toLowerCase();
    email = email.toLowerCase();
    try {
      const [existingUser] = await pool.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
      );
      const users = existingUser as User[];

      if (users.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
        username,
        email,
        hashedPassword,
      ]);

      return { success: true, message: 'Registration successful' };
    } catch (error) {
      throw error;
    }
  }

  static async login(email: string, password: string) {
    email = email.toLowerCase();
    // Fetch user by email
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as { id: number; email: string; username: string; password: string }[];

    if (users.length === 0) {
      throw new Error('Invalid email or password!!');
    }

    const user = users[0];

    // Compare the provided password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Invalid email or password!!');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET ?? '',
      {
        expiresIn: '1h', // Set expiration time for the token
      }
    );

    return token;
  }
}
