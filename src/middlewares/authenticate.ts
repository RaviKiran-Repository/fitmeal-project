import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Find the 'Cookie' header in the raw headers
  const cookieHeader = req.rawHeaders.find((header, index) => header.includes('token='));

  if (cookieHeader) {
    // Cookie is typically in the format: "token=<token_value>"
    const token = cookieHeader.split('='); // Split by cookies

    jwt.verify(token[1], JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token.' });
      }
      req.user = user as User; // Attach user info to request
      next();
    });
  } else {
    res.redirect('/login'); // Redirect to login if token is not present
    return;
  }
};
