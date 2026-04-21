import React from 'react';
import { motion } from 'framer-motion';
import { DrawnCard } from '../lib/tarotEngine';

interface TarotCardProps {
  card?: DrawnCard;
  isFaceUp: boolean;
  isFocused?: boolean;
  isSelected?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isFaceUp,
  isFocused = false,
  isSelected = false,
  style,
  onClick,
}) => {
  const glowColor = isSelected
    ? 'rgba(155, 127, 212, 0.6)'
    : isFocused
    ? 'rgba(201, 168, 76, 0.5)'
    : 'rgba(201, 168, 76, 0.1)';

  return (
    <motion.div
      onClick={onClick}
      style={{
        position: 'relative',
        width: 120,
        height: 200,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      animate={{
        y: isSelected ? -24 : isFocused ? -12 : 0,
        scale: isSelected ? 1.08 : isFocused ? 1.04 : 1,
        filter: `drop-shadow(0 0 ${isSelected ? 24 : isFocused ? 16 : 4}px ${glowColor})`,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          perspective: 800,
        }}
        animate={{ rotateY: isFaceUp ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Card Back */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1a1530 0%, #0f0c1e 100%)',
          border: '1.5px solid rgba(201,168,76,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <CardBack />
        </div>

        {/* Card Face */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 10,
          background: card
            ? `linear-gradient(160deg, ${card.card.colorA} 0%, ${card.card.colorB} 100%)`
            : '#1a1530',
          border: `1.5px solid rgba(201,168,76,${isFocused ? 0.6 : 0.3})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 8px',
          overflow: 'hidden',
        }}>
          {card && (
            <CardFace card={card} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const CardBack: React.FC = () => (
  <svg width="90" height="150" viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer border */}
    <rect x="4" y="4" width="82" height="142" rx="6" stroke="rgba(201,168,76,0.25)" strokeWidth="1"/>
    {/* Inner border */}
    <rect x="9" y="9" width="72" height="132" rx="4" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5"/>
    {/* Corner ornaments */}
    <path d="M14 14 L20 14 M14 14 L14 20" stroke="rgba(201,168,76,0.4)" strokeWidth="1"/>
    <path d="M76 14 L70 14 M76 14 L76 20" stroke="rgba(201,168,76,0.4)" strokeWidth="1"/>
    <path d="M14 136 L20 136 M14 136 L14 130" stroke="rgba(201,168,76,0.4)" strokeWidth="1"/>
    <path d="M76 136 L70 136 M76 136 L76 130" stroke="rgba(201,168,76,0.4)" strokeWidth="1"/>
    {/* Center star */}
    <g transform="translate(45,75)">
      <polygon points="0,-18 4,-7 16,-7 7,0 10,12 0,5 -10,12 -7,0 -16,-7 -4,-7" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.3)" strokeWidth="0.5"/>
    </g>
    {/* Moon crescent */}
    <circle cx="45" cy="35" r="8" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8"/>
    <circle cx="48" cy="35" r="6" fill="var(--bg-mid, #120f1e)" />
    {/* Dots pattern */}
    {[...Array(5)].map((_, row) =>
      [...Array(5)].map((_, col) => (
        <circle
          key={`${row}-${col}`}
          cx={22 + col * 12}
          cy={95 + row * 10}
          r="0.8"
          fill="rgba(201,168,76,0.2)"
        />
      ))
    )}
  </svg>
);

interface CardFaceProps {
  card: DrawnCard;
}

const CardFace: React.FC<CardFaceProps> = ({ card }) => (
  <>
    {/* Number */}
    <div style={{
      fontFamily: 'serif',
      fontSize: 11,
      color: 'rgba(201,168,76,0.7)',
      letterSpacing: 2,
      textAlign: 'center',
    }}>
      {card.card.number === 0 ? '0' : `${card.card.number}`}
    </div>

    {/* Symbol */}
    <div style={{
      fontSize: 32,
      color: 'rgba(201,168,76,0.85)',
      textAlign: 'center',
      transform: card.reversed ? 'rotate(180deg)' : 'none',
      lineHeight: 1,
    }}>
      {card.card.symbol}
    </div>

    {/* Card name */}
    <div style={{
      textAlign: 'center',
      transform: card.reversed ? 'rotate(180deg)' : 'none',
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 'bold',
        color: 'rgba(240,232,216,0.95)',
        letterSpacing: 1,
        fontFamily: 'serif',
        marginBottom: 4,
      }}>
        {card.card.name}
      </div>
      <div style={{
        fontSize: 9,
        color: 'rgba(201,168,76,0.6)',
        letterSpacing: 0.5,
      }}>
        {card.reversed ? '逆位' : '正位'}
      </div>
    </div>

    {/* Keywords */}
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2,
      justifyContent: 'center',
      transform: card.reversed ? 'rotate(180deg)' : 'none',
    }}>
      {card.card.keywords.slice(0, 2).map(kw => (
        <span key={kw} style={{
          fontSize: 8,
          color: 'rgba(201,168,76,0.5)',
          border: '0.5px solid rgba(201,168,76,0.2)',
          borderRadius: 3,
          padding: '1px 4px',
        }}>
          {kw}
        </span>
      ))}
    </div>
  </>
);
