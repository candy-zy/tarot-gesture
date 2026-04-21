import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryRecord {
  id: number;
  created_at: string;
  card_past: string;
  card_present: string;
  card_future: string;
  ai_reading: string;
}

interface SettingsPageProps {
  onBack: () => void;
}

const API_KEY_STORAGE = 'tarot_openai_key';
const SERVER = 'http://localhost:3001';

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Load saved key
  useEffect(() => {
    const k = localStorage.getItem(API_KEY_STORAGE) ?? '';
    setSavedKey(k);
    setApiKey(k);
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/history`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    setSavedKey(trimmed);
    setTestStatus('idle');
    setTestMsg('');
  };

  const handleTestKey = async () => {
    const key = apiKey.trim();
    if (!key.startsWith('sk-')) {
      setTestStatus('error');
      setTestMsg('Key 格式不正确，应以 sk- 开头');
      return;
    }
    setTestStatus('testing');
    setTestMsg('');
    try {
      const res = await fetch(`${SERVER}/api/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          cards: [
            { name: '愚者', reversed: false, position: 'past' },
            { name: '魔术师', reversed: false, position: 'present' },
            { name: '女祭司', reversed: false, position: 'future' },
          ],
          history: [],
          _test: true,
        }),
      });
      if (res.ok) {
        setTestStatus('ok');
        setTestMsg('连接成功 ✓');
        // Also save if test passes
        localStorage.setItem(API_KEY_STORAGE, key);
        setSavedKey(key);
        // Delete the test record
        const data = await res.json();
        if (data.id) {
          await fetch(`${SERVER}/api/history/${data.id}`, { method: 'DELETE' });
        }
      } else {
        const err = await res.json();
        setTestStatus('error');
        setTestMsg(err.error ?? '连接失败');
      }
    } catch {
      setTestStatus('error');
      setTestMsg('无法连接后端，请确认服务器已启动');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await fetch(`${SERVER}/api/history/${id}`, { method: 'DELETE' });
      setHistory(h => h.filter(r => r.id !== id));
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    try {
      await fetch(`${SERVER}/api/history`, { method: 'DELETE' });
      setHistory([]);
    } catch {
      // ignore
    }
    setClearConfirm(false);
  };

  const maskedKey = savedKey
    ? savedKey.slice(0, 7) + '••••••••••••••••' + savedKey.slice(-4)
    : '';

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1,
      color: '#eee7d8',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        position: 'sticky', top: 0,
        background: 'rgba(8,6,17,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <motion.button
          whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(168,152,128,0.6)', fontSize: 12,
            letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'serif',
          }}
        >
          ← 返回
        </motion.button>
        <div style={{ fontSize: 14, color: 'rgba(201,168,76,0.85)', letterSpacing: '0.2em' }}>
          设置
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* ── API Key Section ── */}
        <Section title="OpenAI API Key" icon="🔑">
          <p style={{ fontSize: 12, color: 'rgba(168,152,128,0.6)', marginBottom: 16, lineHeight: 1.7 }}>
            Key 仅保存在本地浏览器，不会上传至任何服务器或 GitHub。
            {savedKey && <span style={{ color: 'rgba(120,200,120,0.7)' }}> 当前已配置：{maskedKey}</span>}
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setTestStatus('idle'); }}
              placeholder="sk-..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#eee7d8',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <GoldButton onClick={handleSaveKey} disabled={!apiKey.trim()}>保存</GoldButton>
            <GoldButton onClick={handleTestKey} disabled={!apiKey.trim() || testStatus === 'testing'}>
              {testStatus === 'testing' ? '测试中…' : '测试'}
            </GoldButton>
          </div>
          <AnimatePresence>
            {testMsg && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: 12,
                  color: testStatus === 'ok' ? 'rgba(120,200,120,0.9)' : 'rgba(220,100,100,0.9)',
                  marginTop: 6,
                }}
              >
                {testMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </Section>

        {/* ── History Section ── */}
        <Section title="占卜历史" icon="📜">
          {historyLoading ? (
            <div style={{ textAlign: 'center', color: 'rgba(168,152,128,0.4)', padding: '32px 0', fontSize: 13 }}>
              加载中…
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(168,152,128,0.35)', padding: '32px 0', fontSize: 13 }}>
              暂无占卜记录
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map(record => (
                  <HistoryCard
                    key={record.id}
                    record={record}
                    expanded={expandedId === record.id}
                    onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    onDelete={() => handleDeleteRecord(record.id)}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <motion.button
                  whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }}
                  onClick={handleClearAll}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${clearConfirm ? 'rgba(220,80,80,0.5)' : 'rgba(201,168,76,0.15)'}`,
                    borderRadius: 8,
                    padding: '8px 20px',
                    color: clearConfirm ? 'rgba(220,80,80,0.8)' : 'rgba(168,152,128,0.5)',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                  }}
                >
                  {clearConfirm ? '再次点击确认清空全部' : '清空全部记录'}
                </motion.button>
              </div>
            </>
          )}
        </Section>

        {/* ── About Section ── */}
        <Section title="关于" icon="✦">
          <div style={{ fontSize: 12, color: 'rgba(168,152,128,0.5)', lineHeight: 2, letterSpacing: '0.06em' }}>
            <p>星月塔罗 · 无形之手</p>
            <p>基于 MediaPipe 手势识别 + OpenAI GPT-4o-mini 解读</p>
            <p>技术栈：React · TypeScript · Vite · Express · Supabase (PostgreSQL)</p>
          </div>
        </Section>
      </div>
    </div>
  );
};

// ── Sub components ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    style={{ marginBottom: 36 }}
  >
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 18,
      paddingBottom: 10,
      borderBottom: '1px solid rgba(201,168,76,0.1)',
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'rgba(201,168,76,0.75)', letterSpacing: '0.15em' }}>{title}</span>
    </div>
    {children}
  </motion.div>
);

const GoldButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <motion.button
    whileHover={disabled ? {} : { opacity: 0.8 }}
    whileTap={disabled ? {} : { scale: 0.96 }}
    onClick={disabled ? undefined : onClick}
    style={{
      background: 'transparent',
      border: `1px solid rgba(201,168,76,${disabled ? '0.1' : '0.3'})`,
      borderRadius: 8,
      padding: '10px 16px',
      color: `rgba(201,168,76,${disabled ? '0.3' : '0.8'})`,
      fontSize: 12,
      letterSpacing: '0.1em',
      cursor: disabled ? 'default' : 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: 'serif',
    }}
  >
    {children}
  </motion.button>
);

const HistoryCard: React.FC<{
  record: HistoryRecord;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ record, expanded, onToggle, onDelete }) => {
  const date = new Date(record.created_at).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      layout
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(201,168,76,0.12)',
        borderRadius: 12,
        padding: '14px 18px',
        cursor: 'pointer',
      }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(168,152,128,0.45)', marginBottom: 7, letterSpacing: '0.08em' }}>
            {date}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: '过去', value: record.card_past },
              { label: '现在', value: record.card_present },
              { label: '未来', value: record.card_future },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 12, color: 'rgba(220,208,190,0.75)' }}>
                <span style={{ color: 'rgba(201,168,76,0.55)', marginRight: 4 }}>{label}</span>
                {value}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(168,152,128,0.35)' }}>{expanded ? '▲' : '▼'}</span>
          <motion.button
            whileHover={{ color: 'rgba(220,80,80,0.8)' }}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(168,152,128,0.3)', fontSize: 12,
              cursor: 'pointer', padding: '2px 4px',
            }}
          >
            删除
          </motion.button>
        </div>
      </div>

      {/* Expanded reading */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(201,168,76,0.08)',
              fontSize: 13,
              lineHeight: 1.9,
              color: 'rgba(215,200,182,0.8)',
              fontFamily: 'serif',
              letterSpacing: '0.04em',
              whiteSpace: 'pre-wrap',
            }}>
              {record.ai_reading}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
