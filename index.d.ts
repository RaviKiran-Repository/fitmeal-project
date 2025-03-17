import { User } from './src/models/User';

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
