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

const NOT_FOUND_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 - Page Not Found | TMC Awards</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Outfit", sans-serif; background: #0b140f; color: #ecfdf5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; box-sizing: border-box; }
    .box { max-width: 500px; width: 100%; padding: 48px 28px; background: #122018; border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 24px; box-shadow: 0 20px 48px rgba(0,0,0,0.65), 0 0 30px rgba(34, 197, 94, 0.12); position: relative; overflow: hidden; }
    .box::before { content: ''; position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 200px; height: 100px; background: radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, transparent 70%); pointer-events: none; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: rgba(34, 197, 94, 0.15); color: #4ade80; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; margin-bottom: 20px; border: 1px solid rgba(34, 197, 94, 0.35); text-transform: uppercase; }
    h1 { font-size: 88px; margin: 0; background: linear-gradient(135deg, #4ade80 0%, #22c55e 40%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; line-height: 1; letter-spacing: -3px; }
    h2 { font-size: 26px; margin: 16px 0 10px; color: #ffffff; font-weight: 800; letter-spacing: -0.01em; }
    p { color: #8ea899; font-size: 15px; line-height: 1.6; margin: 0 0 30px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 28px; background: #189855; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; transition: transform 0.15s, background 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(24, 152, 85, 0.4); }
    .btn:hover { background: #22c55e; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5); }
    .btn:active { transform: translateY(0); }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">⛏️ TMC AWARDS • 404</div>
    <h1>404</h1>
    <h2>Lost in the Nether?</h2>
    <p>The requested page does not exist or access has been restricted. Return to the TMC Awards showcase to browse creators and cast your vote.</p>
    <a href="/" class="btn">Return to TMC Showcase →</a>
  </div>
</body>
</html>`;

// Admin route guard: if user types /admin, /admin/, or /admin.html without ?token=ADMINOFTMC, respond with 404 error
app.get(['/admin', '/admin/', '/admin.html'], (req: Request, res: Response): void => {
  if (req.query.token !== 'ADMINOFTMC') {
    res.status(404).send(NOT_FOUND_PAGE);
    return;
  }
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
