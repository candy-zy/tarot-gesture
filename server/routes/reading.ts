import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { supabase, supabaseAdmin, ReadingRecord } from '../db.js';

const router = Router();

interface CardInfo {
  name: string;
  reversed: boolean;
  position: 'past' | 'present' | 'future';
}

function buildPrompt(cards: CardInfo[], history: ReadingRecord[]): string {
  const posLabel: Record<string, string> = { past: '过去', present: '现在', future: '未来' };

  const cardLines = cards
    .map(c => `· ${posLabel[c.position]}：《${c.name}》${c.reversed ? '逆位' : '正位'}`)
    .join('\n');

  let historySection = '';
  if (history.length > 0) {
    historySection = `\n\n【用户近期占卜记录】\n` +
      history.map((h, i) => {
        const date = new Date(h.created_at).toLocaleDateString('zh-CN');
        return `第${i + 1}次（${date}）：${h.card_past} / ${h.card_present} / ${h.card_future}\n解读摘要：${h.ai_reading.slice(0, 80)}…`;
      }).join('\n\n');
  }

  return `你是一位深邃而温柔的塔罗占卜师，擅长用富有诗意的中文为人解读命运。

本次三牌阵：
${cardLines}
${historySection}

请完成以下解读（总字数控制在300字以内）：
1. 分别解读三张牌（每张2-3句，结合正逆位含义）
2. 综合三牌给出整体洞见${history.length > 0 ? '，若与历史记录有呼应请自然提及' : ''}
3. 给出一句有力量的结尾寄语

风格要求：神秘、温暖、有洞察力，避免生硬套话。直接开始解读，不要说"好的"等开场白。`;
}

router.post('/', async (req: Request, res: Response) => {
  const { cards, apiKey, history = [] } = req.body as {
    cards: CardInfo[];
    apiKey: string;
    history: ReadingRecord[];
  };

  if (!apiKey || !apiKey.startsWith('sk-')) {
    return res.status(400).json({ error: '请先在设置中填入有效的 OpenAI API Key' });
  }
  if (!cards || cards.length !== 3) {
    return res.status(400).json({ error: '需要恰好3张牌' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = buildPrompt(cards, history.slice(0, 3));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.85,
    });

    const reading = completion.choices[0]?.message?.content ?? '解读生成失败，请重试。';

    const past    = cards.find(c => c.position === 'past')!;
    const present = cards.find(c => c.position === 'present')!;
    const future  = cards.find(c => c.position === 'future')!;

    // Insert via REST API with service key — bypasses all RLS
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

    let savedId: number | null = null;
    try {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          card_past:    `《${past.name}》${past.reversed ? '逆位' : '正位'}`,
          card_present: `《${present.name}》${present.reversed ? '逆位' : '正位'}`,
          card_future:  `《${future.name}》${future.reversed ? '逆位' : '正位'}`,
          ai_reading: reading,
        }),
      });

      if (insertRes.ok) {
        const rows = await insertRes.json();
        savedId = rows[0]?.id ?? null;
        console.log('[reading] ✅ 已存储，id:', savedId);
      } else {
        const errText = await insertRes.text();
        console.warn('[reading] 存储失败:', insertRes.status, errText);
      }
    } catch (fetchErr: any) {
      console.warn('[reading] 存储请求失败:', fetchErr.message);
    }

    return res.json({ reading, id: savedId });

  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error';
    if (msg.includes('401') || msg.includes('Incorrect API key')) {
      return res.status(401).json({ error: 'API Key 无效，请检查后重试' });
    }
    if (msg.includes('429')) {
      return res.status(429).json({ error: 'API 调用频率超限，请稍后再试' });
    }
    console.error('[reading] error:', msg);
    return res.status(500).json({ error: `解读失败：${msg}` });
  }
});

export default router;
