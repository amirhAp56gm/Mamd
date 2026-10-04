import { db } from '../db/index.js';
import { User, SelectedItem } from '../../types/index.js';

export class UserService {
  public static getUserById(userId: string): User | null {
    return db.findUserById(userId);
  }

  public static getUserBySteamId(steamId: string): User | null {
    return db.findUserBySteamId(steamId);
  }

  public static getSelectedItems(userId: string): SelectedItem[] {
    return db.getSelectedItems(userId);
  }

  public static saveSelectedItems(userId: string, items: SelectedItem[]): SelectedItem[] {
    return db.saveSelectedItems(userId, items);
  }
}
