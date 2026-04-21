import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ReadingPage } from './components/ReadingPage';
import { SettingsPage } from './components/SettingsPage';
import { AnimatePresence, motion } from 'framer-motion';

type Page = 'home' | 'reading' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('home');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#080611' }}>
      {/* Global background gradient */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(122,89,182,0.12) 0%, rgba(55,33,95,0.08) 35%, transparent 72%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <AnimatePresence mode="wait">
        {page === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HomePage
              onStart={() => setPage('reading')}
              onSettings={() => setPage('settings')}
            />
          </motion.div>
        )}
        {page === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReadingPage onBack={() => setPage('home')} />
          </motion.div>
        )}
        {page === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SettingsPage onBack={() => setPage('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
