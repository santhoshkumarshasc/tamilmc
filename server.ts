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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f17; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .box { max-width: 480px; padding: 48px 24px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(239,68,68,0.15); color: #f87171; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; border: 1px solid rgba(239,68,68,0.3); }
    h1 { font-size: 76px; margin: 0; color: #ef4444; font-weight: 900; line-height: 1; letter-spacing: -2px; }
    h2 { font-size: 24px; margin: 16px 0 10px; color: #f8fafc; font-weight: 700; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 28px; }
    .btn { display: inline-block; padding: 12px 26px; background: #1f9d5e; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; transition: transform 0.15s, background 0.15s; }
    .btn:hover { background: #167e4b; transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">404 ERROR</div>
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The requested page does not exist or access has been restricted. Please check the URL and try again.</p>
    <a href="/" class="btn">Return to TMC Showcase</a>
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
