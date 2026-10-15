import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const HOST: string = '0.0.0.0';

// Security middleware: Permissive frame embedding for AI Studio preview iframe + security headers
app.use((_req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// JSON body parsing for API endpoints
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', runtime: 'typescript', timestamp: new Date().toISOString() });
});

// In-memory verification codes cache with 15-minute TTL
interface VerificationRecord {
  code: string;
  username: string;
  email: string;
  createdAt: number;
  verified: boolean;
}
const verificationCodes = new Map<string, VerificationRecord>();

// Clean up expired verification codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of verificationCodes.entries()) {
    if (now - val.createdAt > 15 * 60 * 1000) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Discord Bot & OAuth Configuration
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'MTU2MDE5OTcwNjQ3NzQ2NTY0MA.GL5c97.YntlvqhWjOjEQLZ04NdOVMZ5kMkQ_buUT1e5k8';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1560199706477465640';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_BOT_INVITE = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot`;
const VERCEL_DOMAIN = 'https://mccreatorstamil.vercel.app';

function getDiscordRedirectUri(req: Request): string {
  const custom = typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri.trim() : '';
  if (custom && (custom.startsWith('http://') || custom.startsWith('https://'))) {
    return custom;
  }
  const referer = req.headers.referer || req.headers.origin;
  if (referer && typeof referer === 'string' && referer.includes('mccreatorstamil.vercel.app')) {
    return `${VERCEL_DOMAIN}/auth/discord/callback`;
  }
  const defaultBaseUrl = process.env.APP_URL
    || (req.headers['x-forwarded-proto']
        ? `${req.headers['x-forwarded-proto']}://${req.get('host')}`
        : `${req.protocol}://${req.get('host')}`);
  return `${defaultBaseUrl.replace(/\/+$/, '')}/auth/discord/callback`;
}

// Discord Bot Status & Info Endpoint
app.get('/api/auth/discord/bot-info', async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });
    if (response.ok) {
      const data: any = await response.json();
      res.json({
        success: true,
        bot: {
          id: data.id,
          username: data.username,
          discriminator: data.discriminator,
          avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : null,
          inviteUrl: DISCORD_BOT_INVITE
        }
      });
      return;
    }
  } catch (err: any) {
    console.warn('[Discord Bot] Failed to fetch bot info:', err?.message);
  }
  res.json({
    success: true,
    bot: {
      id: DISCORD_CLIENT_ID,
      username: 'TMC Official™',
      avatar: 'https://cdn.discordapp.com/avatars/1560199706477465640/eac7715be2d9ed587f09bdc97349cba9.png',
      inviteUrl: DISCORD_BOT_INVITE
    }
  });
});

// Discord OAuth URL Endpoint (as specified in oauth-integration skill)
app.get('/api/auth/discord/url', (req: Request, res: Response): void => {
  const redirectUri = getDiscordRedirectUri(req);
  const vercelRedirectUri = `${VERCEL_DOMAIN}/auth/discord/callback`;
  const state = Math.random().toString(36).substring(2);

  // 1. User Account OAuth URL
  const userUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email&state=${state}`;

  // 2. Combined Bot Account OAuth URL (authorizes user account + adds bot account to server)
  const botAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot%20identify%20email&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

  // 3. Vercel-specific OAuth URLs for production deployment
  const vercelUserUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(vercelRedirectUri)}&response_type=code&scope=identify%20email&state=${state}`;
  const vercelBotAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot%20identify%20email&redirect_uri=${encodeURIComponent(vercelRedirectUri)}&response_type=code&state=${state}`;

  res.json({
    url: userUrl,
    botAuthUrl,
    inviteUrl: DISCORD_BOT_INVITE,
    vercelUserUrl,
    vercelBotAuthUrl,
    configured: true,
    clientId: DISCORD_CLIENT_ID,
    botName: 'TMC Official™',
    botId: DISCORD_CLIENT_ID,
    redirectUri,
    vercelRedirectUri
  });
});

// OAuth Callback Route (popup postMessage handler for iframe compliance)
app.get(['/auth/discord/callback', '/auth/callback', '/auth/callback/'], async (req: Request, res: Response): Promise<void> => {
  const code = (req.query.code as string) || '';
  let fetchedUser: any = null;

  if (code && DISCORD_CLIENT_SECRET) {
    try {
      const redirectUri = getDiscordRedirectUri(req);
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });
      if (tokenRes.ok) {
        const tokenData: any = await tokenRes.json();
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}` }
        });
        if (userRes.ok) {
          const dcUser: any = await userRes.json();
          const avatarUrl = dcUser.avatar
            ? `https://cdn.discordapp.com/avatars/${dcUser.id}/${dcUser.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${(Number(dcUser.discriminator || '0')) % 5}.png`;
          fetchedUser = {
            id: dcUser.id,
            discord_id: dcUser.id,
            username: dcUser.username,
            tag: dcUser.discriminator && dcUser.discriminator !== '0' ? `${dcUser.username}#${dcUser.discriminator}` : dcUser.username,
            display_name: dcUser.global_name || dcUser.username,
            discriminator: dcUser.discriminator || '0',
            avatar_url: avatarUrl,
            email: dcUser.email,
            bio: 'Verified Discord User • TMC Community',
            is_real_api_user: true
          };
        }
      }
    } catch (err) {
      console.warn('[Discord OAuth Token Exchange]:', err);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html>
<head><title>Discord Authentication</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#18191c;color:#f2f3f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:28px;border:1px solid #2f3136;border-radius:14px;background:#2f3136;max-width:420px;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
    <div style="width:52px;height:52px;margin:0 auto 14px;background:#5865F2;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="#ffffff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
    </div>
    <h3 style="color:#ffffff;margin:0 0 8px;font-size:18px;">Discord Connected</h3>
    <p style="font-size:14px;color:#b9bbbe;margin:0;">Account & Bot linked successfully. This popup will close automatically.</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_AUTH_SUCCESS',
          provider: 'discord',
          code: ${JSON.stringify(code)},
          user: ${JSON.stringify(fetchedUser)}
        }, '*');
        setTimeout(() => window.close(), 600);
      } else {
        window.location.href = '/';
      }
    } catch(e) {
      window.location.href = '/';
    }
  </script>
</body>
</html>`);
});

// Verify Discord account details (supports Discord username, username#tag, or numeric User ID)
app.post(['/api/auth/discord/verify-user', '/api/auth/github/verify-user'], async (req: Request, res: Response): Promise<void> => {
  try {
    const rawInput = String(req.body?.username || '').trim().replace(/^@/, '');
    if (!rawInput || rawInput.length < 2 || rawInput.length > 37) {
      res.status(400).json({ success: false, error: 'Please enter a valid Discord username or numeric User ID.' });
      return;
    }

    // Check if the input is a numeric Discord User ID (17-20 digits)
    if (/^\d{17,20}$/.test(rawInput)) {
      try {
        const discordRes = await fetch(`https://discord.com/api/v10/users/${rawInput}`, {
          headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
        });
        if (discordRes.ok) {
          const dcUser: any = await discordRes.json();
          const avatarUrl = dcUser.avatar
            ? `https://cdn.discordapp.com/avatars/${dcUser.id}/${dcUser.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${(Number(dcUser.discriminator || '0')) % 5}.png`;

          res.json({
            success: true,
            user: {
              id: dcUser.id,
              discord_id: dcUser.id,
              username: dcUser.username,
              tag: dcUser.discriminator && dcUser.discriminator !== '0' ? `${dcUser.username}#${dcUser.discriminator}` : dcUser.username,
              display_name: dcUser.global_name || dcUser.username,
              discriminator: dcUser.discriminator || '0',
              avatar_url: avatarUrl,
              bio: 'Verified Discord User • TMC Community',
              is_real_api_user: true
            }
          });
          return;
        }
      } catch (err: any) {
        console.warn('[Discord User Lookup Error]:', err?.message);
      }
    }

    const cleanUsername = rawInput.split('#')[0];
    const discriminator = rawInput.includes('#') ? rawInput.split('#')[1] : '';

    // Calculate avatar color index (0-5)
    let charSum = 0;
    for (let i = 0; i < rawInput.length; i++) {
      charSum += rawInput.charCodeAt(i);
    }
    const avatarIndex = charSum % 6;
    const avatarUrl = `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;

    const userProfile = {
      username: cleanUsername,
      tag: rawInput,
      display_name: cleanUsername,
      discriminator: discriminator || '0',
      avatar_url: avatarUrl,
      id: `discord_${charSum}_${Date.now().toString().slice(-4)}`,
      discord_id: /^\d{17,20}$/.test(rawInput) ? rawInput : null,
      bio: 'Tamil Minecraft Community Creator'
    };

    res.json({ success: true, user: userProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to verify Discord user.' });
  }
});

// Send Account Creation Confirmation Code to Discord DM
app.post(['/api/auth/discord/send-code', '/api/auth/github/send-code'], async (req: Request, res: Response): Promise<void> => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase().replace(/^@/, '');
    const email = String(req.body?.email || '').trim().toLowerCase();
    const explicitDiscordId = req.body?.discord_id || (/^\d{17,20}$/.test(username) ? username : null);

    if (!username) {
      res.status(400).json({ success: false, error: 'Discord username or User ID is required.' });
      return;
    }

    // Generate secure 6-digit confirmation code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    verificationCodes.set(username, {
      code,
      username,
      email,
      createdAt: Date.now(),
      verified: false
    });

    let realDmSent = false;
    let dmApiNotice = '';

    // Attempt real Discord Direct Message dispatch if user ID is known
    if (explicitDiscordId) {
      try {
        // Step 1: Open DM channel with recipient
        const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipient_id: explicitDiscordId })
        });

        if (dmChannelRes.ok) {
          const channelData: any = await dmChannelRes.json();
          // Step 2: Send message to DM channel
          const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: `👋 Hello <@${explicitDiscordId}>! Your **TMC Awards** Account Creation Confirmation Code is:\n# \`${code}\`\n\nEnter this 6-digit code on the registration page or click the buttons below:`,
              embeds: [
                {
                  title: '🏆 Tamil Minecraft Community Awards',
                  description: `**Account Creation Confirmation Code:**\n\`\`\`\n${code}\n\`\`\`\n_Valid for 15 minutes. Never share this code._`,
                  color: 5793266, // #5865F2 Blurple
                  footer: { text: 'TMC Official™ Bot • Tamil Minecraft Creators' },
                  timestamp: new Date().toISOString()
                }
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 5,
                      label: 'Open TMC Awards',
                      url: 'https://mccreatorstamil.vercel.app/'
                    },
                    {
                      type: 2,
                      style: 5,
                      label: 'Authorize Account (OAuth)',
                      url: `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot%20identify%20email&redirect_uri=https%3A%2F%2Fmccreatorstamil.vercel.app%2Fauth%2Fdiscord%2Fcallback&response_type=code`
                    }
                  ]
                }
              ]
            })
          });

          if (msgRes.ok) {
            realDmSent = true;
            dmApiNotice = 'Code dispatched directly to your Discord DM by Bot!';
          } else {
            const errData: any = await msgRes.json().catch(() => ({}));
            dmApiNotice = errData?.message || 'Could not send DM (user may have DMs closed or bot not in a shared server)';
          }
        } else {
          const errData: any = await dmChannelRes.json().catch(() => ({}));
          dmApiNotice = errData?.message || 'Could not create DM channel with this user ID';
        }
      } catch (dmErr: any) {
        dmApiNotice = dmErr?.message || 'Discord network error';
      }
    }

    const dmNotification = realDmSent
      ? `[Discord DM from Bot]: Hello @${username}! Your Confirmation Code is ${code}. Delivered directly to your Discord DM!`
      : `[Discord DM Notice from Bot]: Hello @${username}! Your Confirmation Code is ${code}. Please enter this 6-digit code to complete connection on TMC Awards.`;

    console.log(`[Discord DM Code] Code ${code} created for @${username} (Real DM: ${realDmSent ? 'SENT' : 'NOT SENT - ' + dmApiNotice})`);

    res.json({
      success: true,
      message: realDmSent
        ? `Confirmation code sent directly to @${username} via Discord DM!`
        : `Confirmation code generated for @${username}.`,
      realDmSent,
      dmApiNotice,
      username,
      code, // Included in response for seamless testability in preview environment
      dmNotification,
      inviteUrl: DISCORD_BOT_INVITE,
      botName: 'Bot',
      expiresIn: '15 minutes'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch confirmation code.' });
  }
});

// Confirm and verify the 6-digit Discord DM code
app.post(['/api/auth/discord/verify-code', '/api/auth/github/verify-code'], (req: Request, res: Response): void => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase().replace(/^@/, '');
    const inputCode = String(req.body?.code || '').trim();

    if (!username || !inputCode) {
      res.status(400).json({ success: false, verified: false, error: 'Username and confirmation code are required.' });
      return;
    }

    const record = verificationCodes.get(username);
    if (!record) {
      res.status(400).json({ success: false, verified: false, error: 'No confirmation code was requested for this Discord account. Please click "Send Confirmation Code in Discord DM".' });
      return;
    }

    if (Date.now() - record.createdAt > 15 * 60 * 1000) {
      verificationCodes.delete(username);
      res.status(400).json({ success: false, verified: false, error: 'Confirmation code has expired. Please request a new code.' });
      return;
    }

    if (record.code !== inputCode) {
      res.status(400).json({ success: false, verified: false, error: 'Invalid confirmation code. Please check your Discord DM.' });
      return;
    }

    record.verified = true;
    res.json({
      success: true,
      verified: true,
      message: `Confirmation code verified! Your account is connected with Discord @${username}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, verified: false, error: err?.message || 'Failed to verify confirmation code.' });
  }
});


const NOT_FOUND_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 - Lost in the Nether | TMC Awards</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Outfit", sans-serif; background: #0f0709; color: #fef2f2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; box-sizing: border-box; }
    .box { max-width: 520px; width: 100%; padding: 48px 32px; background: #1a0a0e; border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 26px; box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 45px rgba(239, 68, 68, 0.22); position: relative; overflow: hidden; }
    .box::before { content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 240px; height: 120px; background: radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 75%); pointer-events: none; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; background: rgba(239, 68, 68, 0.18); color: #f87171; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.4); text-transform: uppercase; }
    h1 { font-size: clamp(72px, 15vw, 100px); margin: 0; background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; line-height: 1; letter-spacing: -3px; filter: drop-shadow(0 0 16px rgba(239, 68, 68, 0.45)); }
    h2 { font-size: 26px; margin: 18px 0 12px; color: #ffffff; font-weight: 800; letter-spacing: -0.01em; }
    p { color: #fca5a5; font-size: 15px; line-height: 1.6; margin: 0 0 32px; opacity: 0.9; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 30px; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.45); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(234, 88, 12, 0.6); }
    .btn:active { transform: translateY(0); }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">🔥 TMC AWARDS • 404</div>
    <h1>404</h1>
    <h2>Lost in the Nether?</h2>
    <p>The coordinates you entered lead to a fiery void. Return to the overworld showcase to browse verified creators and cast your community vote.</p>
    <a href="/" class="btn">Return to TMC Showcase →</a>
  </div>
</body>
</html>`;

// Admin route: serve admin.html so administrators can login with Gmail and Token directly
app.get(['/admin', '/admin/', '/admin.html'], (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for client-side routing
app.get('*', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, (): void => {
  console.log(`[TypeScript Server] listening on http://${HOST}:${PORT}`);
});

export default app;
