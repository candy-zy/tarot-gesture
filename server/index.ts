import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import readingRouter from './routes/reading.js';
import historyRouter from './routes/history.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/reading', readingRouter);
app.use('/api/history', historyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌙 星月塔罗后端运行中 → http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
