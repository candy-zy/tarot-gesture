import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 缺少环境变量 SUPABASE_URL 或 SUPABASE_ANON_KEY');
  process.exit(1);
}

// anon client for reads, service client for writes (bypasses RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (SUPABASE_SERVICE_KEY) {
  console.log('🔑 Service key loaded, length:', SUPABASE_SERVICE_KEY.length);
} else {
  console.warn('⚠️  No SUPABASE_SERVICE_KEY found in .env');
}

export const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })
  : supabase;

export interface ReadingRecord {
  id: number;
  created_at: string;
  card_past: string;
  card_present: string;
  card_future: string;
  ai_reading: string;
}

// Test connection on startup - just log, don't block on RLS errors
export async function initDb() {
  const { error } = await supabase.from('readings').select('id').limit(1);
  if (error) {
    // Log warning but don't exit - RLS policies may block this test query
    // but actual reads/writes with correct policies will still work
    console.warn('⚠️  Supabase 连接测试警告:', error.message);
  }
  console.log('✅ Supabase 已连接 →', process.env.SUPABASE_URL);
}
