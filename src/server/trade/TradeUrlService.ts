import { db } from '../db/index.js';
import { User } from '../../types/index.js';

export class TradeUrlService {
  /**
   * Validates a Steam Trade Offer URL format.
   * Standard format: https://steamcommunity.com/tradeoffer/new/?partner=XXXXXX&token=YYYYYY
   */
  public static isValidTradeUrl(url: string): { valid: boolean; error?: string; partner?: string; token?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'لینک ترید نمی‌تواند خالی باشد.' };
    }

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      
      // Check hostname
      if (parsed.hostname !== 'steamcommunity.com') {
        return { valid: false, error: 'دامنه لینک ترید باید steamcommunity.com باشد.' };
      }

      // Check pathname
      if (parsed.pathname !== '/tradeoffer/new' && parsed.pathname !== '/tradeoffer/new/') {
        return { valid: false, error: 'مسیر لینک ترید باید /tradeoffer/new/ باشد.' };
      }

      const partner = parsed.searchParams.get('partner');
      const token = parsed.searchParams.get('token');

      if (!partner || !/^\d+$/.test(partner)) {
        return { valid: false, error: 'پارامتر partner در لینک ترید نامعتبر است یا یافت نشد.' };
      }

      if (!token || !/^[a-zA-Z0-9_-]+$/.test(token)) {
        return { valid: false, error: 'پارامتر token در لینک ترید نامعتبر است یا یافت نشد.' };
      }

      return { valid: true, partner, token };
    } catch {
      return { valid: false, error: 'فرمت لینک ترید نامعتبر است.' };
    }
  }

  /**
   * Saves the trade URL for the authenticated user
   */
  public static saveUserTradeUrl(userId: string, tradeUrl: string): { success: boolean; user?: User; error?: string } {
    const validation = this.isValidTradeUrl(tradeUrl);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const user = db.updateTradeUrl(userId, tradeUrl.trim());
    if (!user) {
      return { success: false, error: 'کاربر یافت نشد.' };
    }

    return { success: true, user };
  }
}
