import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../db.js';

const router = Router();

// GET /api/history — all records, newest first
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('readings')
    .select('id, created_at, card_past, card_present, card_future, ai_reading')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// GET /api/history/recent?limit=3 — for AI context
router.get('/recent', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 3, 10);

  const { data, error } = await supabase
    .from('readings')
    .select('card_past, card_present, card_future, ai_reading, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/history/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

  const r = await fetch(`${supabaseUrl}/rest/v1/readings?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  });
  if (!r.ok) return res.status(500).json({ error: await r.text() });
  return res.json({ success: true });
});

// DELETE /api/history — clear all
router.delete('/', async (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

  const r = await fetch(`${supabaseUrl}/rest/v1/readings?id=neq.0`, {
    method: 'DELETE',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  });
  if (!r.ok) return res.status(500).json({ error: await r.text() });
  return res.json({ success: true });
});

export default router;
