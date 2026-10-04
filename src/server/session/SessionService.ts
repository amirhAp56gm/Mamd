import { db, Session } from '../db/index.js';
import { User } from '../../types/index.js';

export const SESSION_COOKIE_NAME = 'tc_session';

export class SessionService {
  public static createSession(userId: string, steamId: string): Session {
    return db.createSession(userId, steamId);
  }

  public static getSession(token: string): Session | null {
    if (!token) return null;
    return db.getSession(token);
  }

  public static getUserFromSession(token: string): User | null {
    const session = this.getSession(token);
    if (!session) return null;
    return db.findUserById(session.userId);
  }

  public static revokeSession(token: string): void {
    if (!token) return;
    db.deleteSession(token);
  }
}
