import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      const result = await UserService.registerUser(username, email, password);
      res.json(result);
    } catch (error: any) {
      const statusCode = error.message.includes('exists') ? 409 : 500;
      res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await UserService.login(email, password);
      if (!result) {
        res.status(400).json({ error: 'Invalid credentials' });
        result;
      }

      res.cookie('token', result, { httpOnly: true, secure: true, maxAge: 3600000 });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
