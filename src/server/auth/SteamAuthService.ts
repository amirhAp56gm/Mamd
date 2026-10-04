import { db } from '../db/index.js';
import { User } from '../../types/index.js';

export class SteamAuthService {
  private static readonly STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

  /**
   * Generates the OpenID redirect URL for Steam authentication.
   */
  public static getRedirectUrl(baseUrl: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const returnTo = `${cleanBaseUrl}/api/auth/steam/return`;
    const realm = `${cleanBaseUrl}/`;

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnTo,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return `${this.STEAM_OPENID_URL}?${params.toString()}`;
  }

  /**
   * Verifies the OpenID response received from Steam.
   */
  public static async verifyOpenID(queryParams: Record<string, string | string[] | undefined>): Promise<{ valid: boolean; steamId?: string; error?: string }> {
    try {
      const mode = queryParams['openid.mode'];
      if (mode !== 'id_res') {
        return { valid: false, error: 'پاسخ استیم نامعتبر است (حالت id_res نیست).' };
      }

      const claimedId = queryParams['openid.claimed_id'];
      if (typeof claimedId !== 'string') {
        return { valid: false, error: 'شناسه استیم در پاسخ دریافت نشد.' };
      }

      // SteamID64 is typically 17 digits starting with 7656119...
      const steamIdMatch = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17,20})$/);
      if (!steamIdMatch) {
        return { valid: false, error: 'فرمت شناسه استیم نامعتبر است.' };
      }

      const steamId = steamIdMatch[1];

      // Prepare validation payload for Steam
      const validationParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (key.startsWith('openid.') && typeof value === 'string') {
          validationParams.append(key, value);
        }
      }

      // Replace openid.mode with check_authentication
      validationParams.set('openid.mode', 'check_authentication');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.STEAM_OPENID_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: validationParams.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { valid: false, error: 'برقراری ارتباط با سرور استیم جهت احراز هویت با خطا مواجه شد.' };
      }

      const responseText = await response.text();
      const isValid = responseText.includes('is_valid:true');

      if (!isValid) {
        return { valid: false, error: 'تأییدیه احراز هویت استیم توسط سرور رد شد.' };
      }

      return { valid: true, steamId };
    } catch (err) {
      console.error('[SteamAuthService] Verification error:', err);
      return { valid: false, error: 'خطای سرور در اعتبارسنجی ورود استیم.' };
    }
  }

  /**
   * Fetches public profile details (Name, Avatar) from Steam Community XML.
   * Does not require any Steam Web API Key.
   */
  public static async fetchPublicProfile(steamId: string): Promise<{ steamName: string; steamAvatar: string }> {
    const defaultAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const fallbackName = `SteamUser_${steamId.slice(-4)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const profileUrl = `https://steamcommunity.com/profiles/${steamId}/?xml=1`;
      const res = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/xml,application/xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return { steamName: fallbackName, steamAvatar: defaultAvatar };
      }

      const xmlText = await res.text();
      
      const nameMatch = xmlText.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xmlText.match(/<steamID>(.*?)<\/steamID>/);
      const avatarMatch = xmlText.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xmlText.match(/<avatarFull>(.*?)<\/avatarFull>/);

      const steamName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : fallbackName;
      const steamAvatar = avatarMatch && avatarMatch[1] ? avatarMatch[1].trim() : defaultAvatar;

      return { steamName, steamAvatar };
    } catch (err) {
      console.warn(`[SteamAuthService] Could not fetch profile XML for ${steamId}:`, err);
      return { steamName: fallbackName, steamAvatar: defaultAvatar };
    }
  }

  /**
   * Authenticates user from verified SteamID, updates database record, returns User.
   */
  public static async handleVerifiedSteamLogin(steamId: string): Promise<User> {
    const profile = await this.fetchPublicProfile(steamId);

    const user = db.upsertUser({
      steamId,
      steamName: profile.steamName,
      steamAvatar: profile.steamAvatar,
    });

    return user;
  }
}
