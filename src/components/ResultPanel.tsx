import React from 'react';
import { motion } from 'framer-motion';

interface ResultPanelProps {
  summary: string;
  onReset: () => void;
  aiError?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ summary, onReset, aiError }) => {
  const paragraphs = summary.split('\n').filter(p => p.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '32px 24px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Decorative top */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', fontSize: 18, color: 'rgba(201,168,76,0.4)' }}
        >
          ✦
        </motion.div>
        <div style={{ height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)', margin: '8px 0' }}/>
      </div>

      {/* AI error notice */}
      {aiError && (
        <div style={{
          marginBottom: 14,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'rgba(220,80,80,0.08)',
          border: '1px solid rgba(220,80,80,0.2)',
          fontSize: 11,
          color: 'rgba(220,150,150,0.8)',
          letterSpacing: '0.06em',
        }}>
          ⚠ AI解读失败（{aiError}），已切换至本地解读
        </div>
      )}

      {/* Content */}
      <div style={{
        background: 'rgba(16,12,28,0.7)',
        border: '0.5px solid rgba(201,168,76,0.15)',
        borderRadius: 16,
        padding: '28px 28px',
        backdropFilter: 'blur(8px)',
      }}>
        {paragraphs.map((para, i) => {
          const isHeader = para.startsWith('【') || para.startsWith('✦') || para.startsWith('═');
          const isAdvice = para.startsWith('综合建议');

          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.12 }}
              style={{
                fontSize: isHeader ? 14 : 15,
                lineHeight: 1.9,
                color: isHeader
                  ? 'rgba(201,168,76,0.8)'
                  : isAdvice
                  ? 'rgba(201,168,76,0.9)'
                  : 'rgba(220,208,190,0.85)',
                fontFamily: 'serif',
                marginBottom: 14,
                letterSpacing: isHeader ? '0.08em' : '0.03em',
                borderLeft: isHeader ? '2px solid rgba(201,168,76,0.2)' : 'none',
                paddingLeft: isHeader ? 10 : 0,
              }}
            >
              {para}
            </motion.p>
          );
        })}
      </div>

      {/* Bottom decoration */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div style={{ height: '0.5px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)', margin: '0 0 24px' }}/>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.04, borderColor: 'rgba(201,168,76,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          style={{
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 8,
            padding: '10px 28px',
            color: 'rgba(201,168,76,0.7)',
            fontSize: 13,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            fontFamily: 'serif',
          }}
        >
          重新开始
        </motion.button>
      </div>
    </motion.div>
  );
};
