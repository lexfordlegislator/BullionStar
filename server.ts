import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'bullionstar-singapore' });
  });

  app.get('/runtime-env.js', (_req, res) => {
    const publicEnv = {
      VITE_SUPABASE_URL: (process.env.VITE_SUPABASE_URL || '').trim(),
      VITE_SUPABASE_ANON_KEY: (process.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    };
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`window.__BULLIONSTAR_ENV__ = ${JSON.stringify(publicEnv)};`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BullionStar Singapore server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
