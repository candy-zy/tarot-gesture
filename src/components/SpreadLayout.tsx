import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from './TarotCard';
import { DrawnCard } from '../lib/tarotEngine';

interface SpreadLayoutProps {
  mode: 'single' | 'three';
  chosenCards: DrawnCard[];
  flippedIndices: number[];
  onFlip: (index: number) => void;
}

const POSITION_LABELS = {
  past: '过去',
  present: '现在',
  future: '未来',
};

export const SpreadLayout: React.FC<SpreadLayoutProps> = ({
  mode,
  chosenCards,
  flippedIndices,
  onFlip,
}) => {
  const positions = mode === 'single'
    ? [{ x: 0, label: '' }]
    : [
        { x: -160, label: '过去' },
        { x: 0, label: '现在' },
        { x: 160, label: '未来' },
      ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: mode === 'single' ? 0 : 40,
      position: 'relative',
      padding: '20px 0',
    }}>
      {positions.map((pos, index) => {
        const card = chosenCards[index];
        const isFlipped = flippedIndices.includes(index);

        return (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            {pos.label && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                style={{
                  fontSize: 12,
                  color: 'rgba(201,168,76,0.6)',
                  letterSpacing: '0.15em',
                  fontFamily: 'serif',
                }}
              >
                {pos.label}
              </motion.div>
            )}

            {card ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20, delay: index * 0.15 }}
              >
                <TarotCard
                  card={card}
                  isFaceUp={isFlipped}
                  onClick={!isFlipped ? () => onFlip(index) : undefined}
                />
                {!isFlipped && (
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'rgba(201,168,76,0.5)',
                      marginTop: 6,
                      letterSpacing: '0.1em',
                    }}
                  >
                    轻触翻牌
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <EmptySlot />
            )}
          </div>
        );
      })}
    </div>
  );
};

const EmptySlot: React.FC = () => (
  <motion.div
    animate={{ opacity: [0.2, 0.4, 0.2] }}
    transition={{ duration: 2.5, repeat: Infinity }}
    style={{
      width: 120,
      height: 200,
      borderRadius: 10,
      border: '1px dashed rgba(201,168,76,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{ color: 'rgba(201,168,76,0.3)', fontSize: 20 }}>✦</span>
  </motion.div>
);
