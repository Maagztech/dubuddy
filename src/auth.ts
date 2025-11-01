import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export type User = { id: string; username: string; role: string };

// Very small in-memory users demo
const USERS: User[] = [
  { id: '1', username: 'alice', role: 'Admin' },
  { id: '2', username: 'bob', role: 'Manager' },
  { id: '3', username: 'carol', role: 'Viewer' }
];

export function loginHandler(req: Request, res: Response) {
  const { username } = req.body;
  const user = USERS.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: 'Unknown user' });
  const token = jwt.sign(user, SECRET, { expiresIn: '8h' });
  res.json({ token, user });
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid auth' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, SECRET) as any;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
