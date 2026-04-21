import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GestureState } from '../hooks/useHandTracking';

interface GestureIndicatorProps {
  gesture: GestureState;
}

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  gesture,
}) => {
  return (
    <>
      {/* Loading indicator */}
      <AnimatePresence>
        {gesture.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 14, color: 'rgba(201,168,76,0.4)' }}
            >
              ✦
            </motion.div>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(168,152,128,0.4)',
                letterSpacing: '0.1em',
              }}
            >
              感应中...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission denied notice */}
      <AnimatePresence>
        {gesture.permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(20,15,35,0.85)',
              border: '0.5px solid rgba(201,168,76,0.2)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 11,
              color: 'rgba(168,152,128,0.6)',
              letterSpacing: '0.08em',
              zIndex: 100,
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            · 摄像头不可用 · 请点击卡牌进行操作 ·
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle tracking dot — only visible when actively tracking */}
      <AnimatePresence>
        {gesture.isTracking && !gesture.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              left: `${gesture.normalizedX * 100}%`,
              top: `${gesture.normalizedY * 100}%`,
              width: gesture.isPinching ? 20 : 12,
              height: gesture.isPinching ? 20 : 12,
              borderRadius: '50%',
              background: gesture.isPinching
                ? 'radial-gradient(circle, rgba(155,127,212,0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 200,
              transition: 'width 0.2s, height 0.2s, background 0.2s',
            }}
          />
        )}
      </AnimatePresence>

      {/* 临时调试面板 */}
      <div
        style={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 12,
          color: 'rgba(201,168,76,0.9)',
          zIndex: 9999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {(gesture as any).debugMsg || '...'}
      </div>
    </>
  );
};
