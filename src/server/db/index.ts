import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, SelectedItem } from '../../types/index.js';

export interface Session {
  id: string;
  token: string;
  userId: string;
  steamId: string;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  users: Record<string, User>; // keyed by id or steamId
  sessions: Record<string, Session>; // keyed by token
  selectedItems: Record<string, SelectedItem[]>; // keyed by userId
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: {},
    sessions: {},
    selectedItems: {},
  };

  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          sessions: parsed.sessions || {},
          selectedItems: parsed.selectedItems || {},
        };
      } else {
        this.save();
      }
      this.isInitialized = true;
    } catch (err) {
      console.error('[DB] Failed to initialize local storage:', err);
      this.data = { users: {}, sessions: {}, selectedItems: {} };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist data:', err);
    }
  }

  // --- Users ---
  public findUserById(id: string): User | null {
    return this.data.users[id] || null;
  }

  public findUserBySteamId(steamId: string): User | null {
    for (const u of Object.values(this.data.users)) {
      if (u.steamId === steamId) {
        return u;
      }
    }
    return null;
  }

  public upsertUser(user: Partial<User> & { steamId: string }): User {
    let existing = this.findUserBySteamId(user.steamId);
    const now = new Date().toISOString();

    if (existing) {
      existing = {
        ...existing,
        steamName: user.steamName !== undefined ? user.steamName : existing.steamName,
        steamAvatar: user.steamAvatar !== undefined ? user.steamAvatar : existing.steamAvatar,
        tradeUrl: user.tradeUrl !== undefined ? user.tradeUrl : existing.tradeUrl,
        updatedAt: now,
      };
      this.data.users[existing.id] = existing;
      this.save();
      return existing;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      steamId: user.steamId,
      steamName: user.steamName || `SteamUser_${user.steamId.slice(-4)}`,
      steamAvatar: user.steamAvatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      tradeUrl: user.tradeUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.users[newUser.id] = newUser;
    this.save();
    return newUser;
  }

  public updateTradeUrl(userId: string, tradeUrl: string): User | null {
    const user = this.data.users[userId];
    if (!user) return null;
    user.tradeUrl = tradeUrl;
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  // --- Sessions ---
  public createSession(userId: string, steamId: string, ttlMs = 30 * 24 * 60 * 60 * 1000): Session {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

    const session: Session = {
      id: crypto.randomUUID(),
      token,
      userId,
      steamId,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.data.sessions[token] = session;
    this.save();
    return session;
  }

  public getSession(token: string): Session | null {
    const session = this.data.sessions[token];
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }

    return session;
  }

  public deleteSession(token: string): void {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  // --- Selected Items ---
  public getSelectedItems(userId: string): SelectedItem[] {
    return this.data.selectedItems[userId] || [];
  }

  public saveSelectedItems(userId: string, items: SelectedItem[]): SelectedItem[] {
    this.data.selectedItems[userId] = items;
    this.save();
    return items;
  }
}

export const db = new Database();
