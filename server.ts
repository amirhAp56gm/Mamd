import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { SteamAuthService } from './src/server/auth/SteamAuthService.js';
import { SessionService, SESSION_COOKIE_NAME } from './src/server/session/SessionService.js';
import { TradeUrlService } from './src/server/trade/TradeUrlService.js';
import { cs2InventoryService } from './src/server/inventory/CS2InventoryService.js';
import { UserService } from './src/server/users/UserService.js';
import { User, SelectedItem } from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable trust proxy for secure cookies behind reverse proxy / Cloud Run
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Helper to determine current base URL for Steam OpenID redirection
 */
function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`.replace(/\/+$/, '');
}

/**
 * Authentication Middleware: Extracts user from session cookie
 */
function requireAuth(req: Request & { user?: User }, res: Response, next: NextFunction) {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ success: false, error: 'احراز هویت انجام نشده است. لطفاً ابتدا با استیم وارد شوید.' });
  }

  const user = SessionService.getUserFromSession(token);
  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ success: false, error: 'نشست کاربری نامعتبر است یا منقضی شده است.' });
  }

  req.user = user;
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// 1. Steam Login URL (for popup / direct navigation)
app.get('/api/auth/steam/url', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const redirectUrl = SteamAuthService.getRedirectUrl(baseUrl);
  res.json({ url: redirectUrl });
});

// Steam Login Initiation (Direct redirect fallback)
app.get('/api/auth/steam/login', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const redirectUrl = SteamAuthService.getRedirectUrl(baseUrl);
  res.redirect(redirectUrl);
});

// 2. Steam OpenID Return Handler (handles popup callback and posts message to parent window)
app.get('/api/auth/steam/return', async (req: Request, res: Response) => {
  try {
    const queryParams = req.query as Record<string, string | string[] | undefined>;
    
    // Server-side OpenID verification with Steam
    const verification = await SteamAuthService.verifyOpenID(queryParams);
    if (!verification.valid || !verification.steamId) {
      console.error('[Auth] OpenID validation failed:', verification.error);
      const errorMsg = verification.error || 'خطا در تایید هویت استیم';
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>خطا در ورود به استیم</title>
          <style>
            body { font-family: sans-serif; background: #0B0C10; color: #F5F5F5; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          </style>
        </head>
        <body>
          <h3 style="color: #f87171;">خطا در تایید هویت استیم</h3>
          <p style="color: #9CA3AF; font-size: 13px;">${errorMsg}</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'STEAM_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => { window.close(); }, 2500);
              } else {
                setTimeout(() => { window.location.href = '/?auth_error=' + encodeURIComponent(${JSON.stringify(errorMsg)}); }, 2000);
              }
            } catch (e) {
              window.location.href = '/';
            }
          </script>
        </body>
        </html>
      `);
    }

    const steamId = verification.steamId;
    
    // Create/Update user in database
    const user = await SteamAuthService.handleVerifiedSteamLogin(steamId);

    // Create session
    const session = SessionService.createSession(user.id, user.steamId);

    // In iframe contexts (e.g. AI Studio preview), SameSite=none and Secure=true are mandatory
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    // Return HTML that posts message to opener and closes the popup
    res.send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>احراز هویت موفق استیم</title>
        <style>
          body {
            font-family: sans-serif;
            background: #0B0C10;
            color: #F5F5F5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #242832;
            border-top: 3px solid #BACAff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h3 style="margin: 0 0 8px 0; color: #BACAff;">ورود با موفقیت انجام شد</h3>
        <p style="color: #9CA3AF; font-size: 13px; margin: 0;">در حال بازگشت به تهران CS...</p>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'STEAM_AUTH_SUCCESS', steamId: ${JSON.stringify(steamId)} }, '*');
              setTimeout(() => { window.close(); }, 400);
            } else {
              window.location.href = '/sell';
            }
          } catch (e) {
            window.location.href = '/sell';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Auth] Steam return exception:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>خطای سیستم</title>
        <style>
          body { font-family: sans-serif; background: #0B0C10; color: #F5F5F5; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        </style>
      </head>
      <body>
        <h3 style="color: #f87171;">خطای ناشناخته در ورود با استیم</h3>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'STEAM_AUTH_ERROR', error: 'خطای ناشناخته در ورود با استیم' }, '*');
            setTimeout(() => { window.close(); }, 2500);
          }
        </script>
      </body>
      </html>
    `);
  }
});

// 3. Logout Endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (token) {
    SessionService.revokeSession(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

// ----------------------------------------------------
// USER & INVENTORY ROUTES
// ----------------------------------------------------

// 4. Current Authenticated User Info
app.get('/api/me', (req: Request, res: Response) => {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return res.json({ user: null });
  }

  const user = SessionService.getUserFromSession(token);
  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.json({ user: null });
  }

  res.json({ user });
});

// 5. Update Steam Trade URL
app.put('/api/me/trade-url', requireAuth, (req: Request & { user?: User }, res: Response) => {
  const { tradeUrl } = req.body;
  if (!tradeUrl || typeof tradeUrl !== 'string') {
    return res.status(400).json({ success: false, error: 'لینک ترید معتبر وارد کنید.' });
  }

  const result = TradeUrlService.saveUserTradeUrl(req.user!.id, tradeUrl);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, user: result.user });
});

// 6. Get Real CS2 Inventory (Never uses client-provided SteamID)
app.get('/api/me/cs2/inventory', requireAuth, async (req: Request & { user?: User }, res: Response) => {
  try {
    const steamId = req.user!.steamId;
    const forceRefresh = req.query.refresh === 'true';

    const inventoryResult = await cs2InventoryService.getInventory(steamId, forceRefresh);
    res.json(inventoryResult);
  } catch (err) {
    console.error('[Inventory] Exception in /api/me/cs2/inventory:', err);
    res.status(500).json({
      success: false,
      items: [],
      errorType: 'STEAM_ERROR',
      message: 'دریافت موجودی با خطا مواجه شد.',
    });
  }
});

// 7. Get Persisted Selected Items for Sale
app.get('/api/me/sell-items', requireAuth, (req: Request & { user?: User }, res: Response) => {
  const items = UserService.getSelectedItems(req.user!.id);
  res.json({ success: true, items });
});

// 8. Save Selected Items for Sale
app.post('/api/me/sell-items', requireAuth, (req: Request & { user?: User }, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'لیست آیتم‌ها نامعتبر است.' });
  }

  // Sanitize and persist selected items
  const sanitizedItems: SelectedItem[] = items.map((item: any) => ({
    id: item.id || `${req.user!.id}_${item.assetId}`,
    userId: req.user!.id,
    assetId: String(item.assetId),
    classId: String(item.classId),
    instanceId: String(item.instanceId || '0'),
    marketHashName: String(item.marketHashName || item.name),
    itemName: String(item.name || item.marketHashName),
    iconUrl: String(item.iconUrl || ''),
    rarity: item.rarity || null,
    exterior: item.exterior || null,
    statTrak: Boolean(item.statTrak),
    souvenir: Boolean(item.souvenir),
    tradable: Boolean(item.tradable),
    createdAt: new Date().toISOString(),
  }));

  const saved = UserService.saveSelectedItems(req.user!.id, sanitizedItems);
  res.json({ success: true, items: saved });
});

// ----------------------------------------------------
// FRONTEND INTEGRATION (Vite / Static)
// ----------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tehran CS] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Tehran CS] Server startup error:', err);
  process.exit(1);
});
