import React from 'react';
import { motion } from 'framer-motion';

interface HomePageProps {
  onStart: () => void;
  onSettings: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStart, onSettings }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Settings gear button */}
      <motion.button
        whileHover={{ rotate: 60, opacity: 0.9 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSettings}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          color: 'rgba(201,168,76,0.35)',
          lineHeight: 1,
          padding: 4,
          transition: 'color 0.2s',
          zIndex: 10,
        }}
        title="设置"
      >
        ⚙
      </motion.button>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 36%, rgba(201,168,76,0.08), transparent 52%), radial-gradient(circle at 50% 50%, rgba(91,60,160,0.22), transparent 60%)',
      }} />

      {/* Magic circle image — hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', marginBottom: 36 }}
      >
        {/* Slow rotation wrapper */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ width: 220, height: 220 }}
        >
          <img
            src="/magic-circle.png"
            alt="星月法阵"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.82,
              filter: 'brightness(0.85) drop-shadow(0 0 20px rgba(201,168,76,0.4)) drop-shadow(0 0 8px rgba(255,235,140,0.25))',
            }}
          />
        </motion.div>

        {/* Gentle pulsing outer glow */}
        <motion.div
          animate={{ opacity: [0.18, 0.38, 0.18], scale: [1, 1.06, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -28,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.18), rgba(140,100,220,0.08), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        style={{
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontFamily: 'serif',
          fontWeight: 'normal',
          letterSpacing: '0.18em',
          color: 'rgba(201,168,76,0.92)',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        星月塔罗
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
        style={{
          fontSize: 13,
          color: 'rgba(168,152,128,0.75)',
          letterSpacing: '0.2em',
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        以无形之手，触碰命运的低语
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.5, delay: 1.1 }}
        style={{
          fontSize: 11,
          color: 'rgba(168,152,128,0.55)',
          letterSpacing: '0.14em',
          marginBottom: 52,
          textAlign: 'center',
        }}
      >
        · 需要摄像头权限以感应手势 ·
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.0 }}
      >
        <motion.button
          whileHover={{ scale: 1.05, borderColor: 'rgba(201,168,76,0.65)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          style={{
            background: 'rgba(22,18,44,0.85)',
            border: '1px solid rgba(201,168,76,0.28)',
            borderRadius: 14,
            padding: '28px 44px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            minWidth: 230,
            color: 'inherit',
            fontFamily: 'inherit',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 40px rgba(91,60,160,0.18)',
          }}
        >
          <span style={{ fontSize: 26, color: 'rgba(201,168,76,0.75)' }}>✦</span>
          <span style={{ fontSize: 16, letterSpacing: '0.12em', color: 'rgba(240,232,216,0.92)' }}>
            开始占卜
          </span>
          <span style={{ fontSize: 11, color: 'rgba(168,152,128,0.6)', letterSpacing: '0.06em' }}>
            三张牌阵 · 过去 / 现在 / 未来
          </span>
        </motion.button>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.7 }}
        style={{
          marginTop: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {[
          '① 食指在空中画圆 → 唤醒法阵',
          '② 左右移动手掌 → 旋转命运之轮',
          '③ 握拳 → 选牌 / 确认操作',
        ].map((text, i) => (
          <p key={i} style={{
            fontSize: 11,
            color: `rgba(168,152,128,${0.45 - i * 0.08})`,
            letterSpacing: '0.1em',
            margin: 0,
          }}>
            {text}
          </p>
        ))}
        <p style={{ fontSize: 10, color: 'rgba(168,152,128,0.22)', letterSpacing: '0.1em', marginTop: 4 }}>
          · 也可直接点击操作 ·
        </p>
      </motion.div>
    </div>
  );
};
