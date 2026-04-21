import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from './TarotCard';
import { SpreadLayout } from './SpreadLayout';
import { ResultPanel } from './ResultPanel';
import { GestureIndicator } from './GestureIndicator';
import { useHandTracking } from '../hooks/useHandTracking';
import { useTarotReading } from '../hooks/useTarotReading';

interface ReadingPageProps {
  onBack: () => void;
}

type SceneStage = 'intro' | 'preview' | 'select';

// ─── Stage 1: Magic Circle glows as you draw ─────────────────────────────────
const IntroMagicCircle: React.FC<{
  summonProgress: number;
  didCircleSummon: boolean;
  onClick: () => void;
}> = ({ summonProgress, didCircleSummon, onClick }) => {
  const glow = didCircleSummon ? 1 : summonProgress;
  const circumference = 2 * Math.PI * 210;

  return (
    <motion.div
      onClick={onClick}
      style={{
        position: 'relative',
        width: 440,
        height: 440,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* The magic circle image — darkened until activated */}
      <img
        src="/magic-circle.png"
        alt="命运法阵"
        style={{
          position: 'absolute',
          inset: 10,
          width: 'calc(100% - 20px)',
          height: 'calc(100% - 20px)',
          objectFit: 'contain',
          borderRadius: '50%',
          mixBlendMode: 'screen' as const,
          opacity: 0.8 + glow * 0.2,
          filter: [
            `brightness(${0.5 + glow * 1.5})`,
            `saturate(${0.4 + glow * 1.4})`,
            `drop-shadow(0 0 ${6 + glow * 52}px rgba(201,168,76,${0.1 + glow * 0.8}))`,
            `drop-shadow(0 0 ${3 + glow * 24}px rgba(255,245,160,${0.06 + glow * 0.6}))`,
          ].join(' '),
          transition: 'opacity 0.12s ease, filter 0.12s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Slowly rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1.5px solid rgba(201,168,76,${0.06 + glow * 0.3})`,
          pointerEvents: 'none',
        }}
      />

      {/* Progress arc — lights up as you draw */}
      {summonProgress > 0.01 && !didCircleSummon && (
        <svg
          style={{ position: 'absolute', inset: -2, pointerEvents: 'none' }}
          width={444}
          height={444}
          viewBox="0 0 444 444"
        >
          <circle
            cx={222} cy={222} r={218}
            fill="none"
            stroke="rgba(201,168,76,0.08)"
            strokeWidth={2}
          />
          <circle
            cx={222} cy={222} r={218}
            fill="none"
            stroke={`rgba(255,225,140,${0.4 + summonProgress * 0.55})`}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${summonProgress * circumference * (440/420)} ${circumference * 1.05}`}
            strokeDashoffset={circumference * 1.05 * 0.25}
            style={{ transition: 'stroke-dasharray 0.08s linear' }}
          />
        </svg>
      )}

      {/* Burst flash on summon */}
      <AnimatePresence>
        {didCircleSummon && (
          <motion.div
            key="burst"
            initial={{ opacity: 0.8, scale: 0.85 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,248,180,0.5), rgba(201,168,76,0.15), transparent 68%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Central text overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '0 40px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: `rgba(201,168,76,${0.55 + glow * 0.4})`,
            letterSpacing: '0.2em',
            fontFamily: 'serif',
            marginBottom: 10,
            textShadow: glow > 0.2 ? `0 0 ${glow * 18}px rgba(255,225,140,0.9)` : 'none',
            transition: 'color 0.15s, text-shadow 0.15s',
          }}
        >
          命运法阵
        </div>
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.9,
            color: `rgba(215,200,182,${0.4 + glow * 0.4})`,
            letterSpacing: '0.1em',
            transition: 'color 0.15s',
          }}
        >
          以食指在空中缓缓画圆
          <br />
          法阵将逐步点亮
          <br />
          <span style={{ opacity: 0.55, fontSize: 11 }}>
            · 点击任意位置可直接进入 ·
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Stage 2: Orbiting cards + magic circle rotates with hand ────────────────
const PreviewScene: React.FC<{
  rotation: number;
  confirmProgress: number;
}> = ({ rotation, confirmProgress }) => {
  const CARD_COUNT = 8;
  const RADIUS = 260;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Magic circle — rotates directly with hand movement */}
      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          transform: `rotate(${rotation}deg)`,
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/magic-circle.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'screen' as const,
            opacity: 0.7 + confirmProgress * 0.3,
            filter: [
              `brightness(${0.65 + confirmProgress * 0.9})`,
              `saturate(${0.8 + confirmProgress * 0.8})`,
              `drop-shadow(0 0 ${18 + confirmProgress * 44}px rgba(201,168,76,${0.3 + confirmProgress * 0.6}))`,
              `drop-shadow(0 0 ${8 + confirmProgress * 22}px rgba(255,245,160,${0.15 + confirmProgress * 0.5}))`,
            ].join(' '),
            transition: 'opacity 0.1s ease, filter 0.1s ease',
          }}
        />
      </div>

      {/* Cards orbit around the circle */}
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        {Array.from({ length: CARD_COUNT }).map((_, i) => {
          const angleDeg = rotation + (360 / CARD_COUNT) * i - 90;
          const rad = (angleDeg * Math.PI) / 180;
          const x = RADIUS * Math.cos(rad);
          const y = RADIUS * Math.sin(rad);

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`,
                willChange: 'transform',
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 104,
                  borderRadius: 11,
                  background: 'linear-gradient(180deg, rgba(22,16,44,0.97), rgba(14,10,28,0.97))',
                  border: `1px solid rgba(201,168,76,${0.2 + confirmProgress * 0.55})`,
                  boxShadow: `0 0 ${8 + confirmProgress * 20}px rgba(201,168,76,${0.1 + confirmProgress * 0.35})`,
                  transition: 'border-color 0.1s, box-shadow 0.1s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 6,
                  border: '1px solid rgba(201,168,76,0.14)',
                  borderRadius: 7,
                }} />
                <div style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  width: 18, height: 18,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '1px solid rgba(201,168,76,0.12)',
                }} />
              </div>
            </div>
          );
        })}

        {/* Confirm progress indicator */}
        {confirmProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0, top: 0,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{
              fontSize: 12,
              color: 'rgba(255,225,140,0.95)',
              marginBottom: 10,
              letterSpacing: '0.14em',
              textShadow: '0 0 14px rgba(255,225,140,0.7)',
            }}>
              进入选牌中…
            </div>
            <div style={{
              width: 150,
              height: 4,
              borderRadius: 999,
              background: 'rgba(255,225,140,0.1)',
              overflow: 'hidden',
              margin: '0 auto',
            }}>
              <div style={{
                width: `${confirmProgress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, rgba(255,225,140,0.55), rgba(255,242,195,0.98))',
                transition: 'width 60ms linear',
                boxShadow: '0 0 8px rgba(255,225,140,0.7)',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ReadingPage ─────────────────────────────────────────────────────────
export const ReadingPage: React.FC<ReadingPageProps> = ({ onBack }) => {
  const {
    state,
    startReading,
    setFocusedIndex,
    selectCard,
    startRevealing,
    flipCard,
    setSummary,
    reset,
  } = useTarotReading();

  const gesture = useHandTracking(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [sceneStage, setSceneStage] = useState<SceneStage>('intro');
  const [previewRotation, setPreviewRotation] = useState(0);
  const [previewConfirmProgress, setPreviewConfirmProgress] = useState(0);

  const prevPreviewXRef = useRef<number | null>(null);
  const previewPinchStartRef = useRef<number | null>(null);
  const previewEnteredRef = useRef(false);
  const rotationRef = useRef(0); // source of truth for rotation

  const selectPinchStartRef = useRef<number | null>(null);
  const focusedStableIndexRef = useRef<number | null>(null);
  const focusedStableSinceRef = useRef(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [fistProgress, setFistProgress] = useState(0);
  const fistStartRef = useRef<number | null>(null);
  const gestureFistRef = useRef(gesture.isFist);
  useEffect(() => { gestureFistRef.current = gesture.isFist; }, [gesture.isFist]);
  const FIST_HOLD_MS = 3000;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragActiveRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollTopRef = useRef(0);

  const previewHoldMs = 380;

  const goToPreview = useCallback(() => {
    if (previewEnteredRef.current) return;
    previewEnteredRef.current = true;
    setSceneStage('preview');
  }, []);

  const selectEnteredAtRef = useRef(0);

  const goToSelect = useCallback(() => {
    startReading();
    selectEnteredAtRef.current = Date.now(); // record entry time
    setSceneStage('select');
    setPreviewConfirmProgress(0);
  }, [startReading]);

  // Stage 1: Circle summon triggers preview (with brief delay for burst)
  useEffect(() => {
    if (sceneStage !== 'intro') return;
    if (gesture.didCircleSummon) {
      const t = setTimeout(goToPreview, 700);
      return () => clearTimeout(t);
    }
  }, [gesture.didCircleSummon, sceneStage, goToPreview]);

  // Stage 2: RAF loop — auto-drift + hand-controlled rotation
  // KEY FIX: gesture.normalizedX changes on every frame, but we need it in the RAF
  // We keep a ref so the RAF closure always has fresh values
  const gestureXRef = useRef(gesture.normalizedX);
  const gestureTrackingRef = useRef(gesture.isTracking);

  useEffect(() => { gestureXRef.current = gesture.normalizedX; }, [gesture.normalizedX]);
  useEffect(() => { gestureTrackingRef.current = gesture.isTracking; }, [gesture.isTracking]);

  useEffect(() => {
    if (sceneStage !== 'preview') {
      prevPreviewXRef.current = null;
      return;
    }

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;

      // Base auto-rotation
      let delta = 0.006 * dt;

      if (gestureTrackingRef.current) {
        const x = gestureXRef.current;

        if (prevPreviewXRef.current === null) {
          prevPreviewXRef.current = x;
        } else {
          const dx = x - prevPreviewXRef.current;
          prevPreviewXRef.current = x;

          // Large multiplier so movement feels substantial
          // mediapipe selfieMode: moving hand RIGHT → x decreases → dx negative → we want CW (+)
          if (Math.abs(dx) > 0.0008) {
            delta += -dx * 180;
          }
        }
      } else {
        prevPreviewXRef.current = null;
      }

      rotationRef.current += delta;
      setPreviewRotation(rotationRef.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneStage]); // only sceneStage — refs handle the rest

  // Stage 2: Pinch hold → enter selection
  // Use refs + interval so progress updates every tick while pinching
  const gesturePinchingRef = useRef(gesture.isPinching);
  const gestureTrackingForPinchRef = useRef(gesture.isTracking);
  useEffect(() => { gesturePinchingRef.current = gesture.isPinching; }, [gesture.isPinching]);
  useEffect(() => { gestureTrackingForPinchRef.current = gesture.isTracking; }, [gesture.isTracking]);

  useEffect(() => {
    if (sceneStage !== 'preview') {
      previewPinchStartRef.current = null;
      setPreviewConfirmProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const pinching = gesturePinchingRef.current;
      const tracking = gestureTrackingForPinchRef.current;

      if (!tracking || !pinching) {
        previewPinchStartRef.current = null;
        setPreviewConfirmProgress(0);
        return;
      }

      const now = Date.now();
      if (previewPinchStartRef.current === null) {
        previewPinchStartRef.current = now;
        return;
      }

      const held = now - previewPinchStartRef.current;
      const progress = Math.min(1, held / previewHoldMs);
      setPreviewConfirmProgress(progress);

      if (held >= previewHoldMs) {
        previewPinchStartRef.current = null;
        clearInterval(interval);
        goToSelect();
      }
    }, 30);

    return () => {
      clearInterval(interval);
      previewPinchStartRef.current = null;
      setPreviewConfirmProgress(0);
    };
  }, [sceneStage, goToSelect]);

  // Stage 3: Hover to highlight
  useEffect(() => {
    if (sceneStage !== 'select' || state.step !== 'selecting' || !gesture.isTracking) return;

    const count = state.availableCards.length;
    if (!count) return;

    // Use normalizedX directly; selfieMode mirrors video but landmarks match screen coords
    const px = gesture.normalizedX * window.innerWidth;
    const py = gesture.normalizedY * window.innerHeight;

    let bestIndex = -1;
    let bestDist = Infinity;

    for (let i = 0; i < count; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const cardCx = rect.left + rect.width / 2;
      const cardCy = rect.top + rect.height / 2;
      // Expand hit area horizontally by 60px to make edge cards easier to reach
      const dx = Math.max(0, Math.abs(px - cardCx) - 60);
      const dy = Math.abs(py - cardCy);
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist && state.availableCards[i] !== null) { bestDist = dist; bestIndex = i; }
    }

    if (bestIndex >= 0) {
      const now = Date.now();
      if (focusedStableIndexRef.current !== bestIndex) {
        focusedStableIndexRef.current = bestIndex;
        focusedStableSinceRef.current = now;
      }
      if (now - focusedStableSinceRef.current > 260) setFocusedIndex(bestIndex);
    }
  }, [sceneStage, state.step, state.availableCards.length, gesture.isTracking, gesture.normalizedX, gesture.normalizedY, setFocusedIndex]);

  // Stage 3: 握拳保持1秒 = 选中高亮牌，选满3张自动进入翻牌
  const focusedIndexRef = useRef(state.focusedIndex);
  const stepRef = useRef(state.step);
  useEffect(() => { focusedIndexRef.current = state.focusedIndex; }, [state.focusedIndex]);
  useEffect(() => { stepRef.current = state.step; }, [state.step]);

  const FIST_SELECT_MS = 3000; // 握拳3秒选中一张牌

  useEffect(() => {
    if (sceneStage !== 'select') {
      fistStartRef.current = null;
      setFistProgress(0);
      return;
    }

    const interval = setInterval(() => {
      if (stepRef.current !== 'selecting') {
        fistStartRef.current = null;
        setFistProgress(0);
        return;
      }

      const now = Date.now();
      const tracking = gestureTrackingForPinchRef.current;
      const fisting = gestureFistRef.current;

      // 进入页面1.2秒内不响应
      if (now - selectEnteredAtRef.current < 1200) {
        fistStartRef.current = null;
        setFistProgress(0);
        return;
      }

      if (tracking && fisting) {
        // 开始握拳计时
        if (fistStartRef.current === null) {
          fistStartRef.current = now;
        }
        const held = now - fistStartRef.current;
        const progress = Math.min(1, held / FIST_SELECT_MS);
        setFistProgress(progress);

        if (held >= FIST_SELECT_MS) {
          // 选中当前高亮牌
          selectCard(focusedIndexRef.current);
          fistStartRef.current = null;
          setFistProgress(0);
          // 重置进入时间，防止连续误触
          selectEnteredAtRef.current = now;
        }
      } else {
        // 松拳，重置
        fistStartRef.current = null;
        setFistProgress(0);
      }
    }, 30);

    return () => {
      clearInterval(interval);
      fistStartRef.current = null;
      setFistProgress(0);
    };
  }, [sceneStage, selectCard]);

  useEffect(() => {
    if (state.step === 'selected') {
      const t = setTimeout(() => startRevealing(), 600);
      return () => clearTimeout(t);
    }
  }, [state.step, startRevealing]);

  useEffect(() => {
    if (state.step !== 'revealing') return;
    const nextIndex = state.chosenCards.findIndex((_, i) => !state.flippedIndices.includes(i));
    if (nextIndex === -1) return;
    const t = setTimeout(() => flipCard(nextIndex), 900 + nextIndex * 400);
    return () => clearTimeout(t);
  }, [state.step, state.flippedIndices, state.chosenCards, flipCard]);

  // When all cards flipped → call AI for reading
  useEffect(() => {
    if (state.step !== 'reading') return;
    if (state.summary) return; // already have summary
    if (state.chosenCards.length !== 3) return;

    const apiKey = localStorage.getItem('tarot_openai_key') ?? '';

    async function fetchReading() {
      setAiLoading(true);
      setAiError('');
      try {
        // Get recent history for context
        let history = [];
        try {
          const hRes = await fetch('http://localhost:3001/api/history/recent?limit=3');
          if (hRes.ok) history = await hRes.json();
        } catch { /* server might not be running */ }

        const cards = state.chosenCards.map(c => ({
          name: c.card.name,
          reversed: c.reversed,
          position: c.position!,
        }));

        if (!apiKey) {
          // Fallback to local generation if no API key
          const { generateThreeSummary } = await import('../lib/tarotEngine');
          setSummary(generateThreeSummary(state.chosenCards));
          return;
        }

        const res = await fetch('http://localhost:3001/api/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards, apiKey, history }),
        });

        const data = await res.json();
        if (res.ok) {
          setSummary(data.reading);
        } else {
          setAiError(data.error ?? '解读失败');
          // Fallback to local
          const { generateThreeSummary } = await import('../lib/tarotEngine');
          setSummary(generateThreeSummary(state.chosenCards));
        }
      } catch {
        // Server not running — fallback to local
        const { generateThreeSummary } = await import('../lib/tarotEngine');
        setSummary(generateThreeSummary(state.chosenCards));
      } finally {
        setAiLoading(false);
      }
    }

    fetchReading();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  // Stage 4: Pinch-drag scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (state.step !== 'reading' || !container) { dragActiveRef.current = false; return; }

    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) { dragActiveRef.current = false; return; }
    if (!gesture.isTracking || !gesture.isPinching) { dragActiveRef.current = false; return; }

    if (!dragActiveRef.current) {
      dragActiveRef.current = true;
      dragStartYRef.current = gesture.normalizedY;
      dragStartScrollTopRef.current = container.scrollTop;
      return;
    }

    const deltaY = gesture.normalizedY - dragStartYRef.current;
    // Reverse direction: hand moves up (y decreases) → scroll down
    container.scrollTop = Math.max(0, Math.min(maxScroll, dragStartScrollTopRef.current - deltaY * 2200));
  }, [gesture.normalizedY, gesture.isPinching, gesture.isTracking, state.step]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (state.step === 'selecting' && state.availableCards[index]) selectCard(index);
      else if (state.step === 'revealing') {
        const i = state.chosenCards.findIndex((_, idx) => !state.flippedIndices.includes(idx));
        if (i !== -1) flipCard(i);
      }
    },
    [state.step, state.chosenCards, state.flippedIndices, selectCard, flipCard]
  );

  const handleReset = useCallback(() => {
    dragActiveRef.current = false;
    prevPreviewXRef.current = null;
    previewPinchStartRef.current = null;
    previewEnteredRef.current = false;
    selectPinchStartRef.current = null;
    focusedStableIndexRef.current = null;
    focusedStableSinceRef.current = 0;
    rotationRef.current = 0;
    reset();
    setAiLoading(false);
    setAiError('');
    setPreviewConfirmProgress(0);
    setPreviewRotation(0);
    setSceneStage('intro');
  }, [reset]);

  const remainingCount = 3 - state.chosenCards.length;

  const stageHint =
    sceneStage === 'intro'
      ? '以食指在空中画圆，法阵将逐步点亮'
      : sceneStage === 'preview'
      ? previewConfirmProgress > 0
        ? '确认中…保持捏合'
        : '左右移动手掌旋转法阵 · 捏合并保持以进入选牌'
      : state.step === 'selecting'
      ? `移动手掌对准牌面高亮 · 握拳 3 秒选中 · 还需选 ${remainingCount} 张`
      : state.step === 'reading'
      ? '捏合并上下拖动可滚动解读'
      : '';

  return (
    <div style={{
      height: '100vh',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#eee7d8',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 40%, rgba(150,113,235,0.16), transparent 28%), radial-gradient(circle at 50% 50%, rgba(91,60,160,0.22), transparent 56%)',
        zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', flexShrink: 0, position: 'relative', zIndex: 2,
      }}>
        <motion.button
          whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.95 }} onClick={onBack}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(168,152,128,0.5)', fontSize: 12,
            letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'serif',
          }}
        >
          ← 返回
        </motion.button>
        <div style={{ fontSize: 13, color: 'rgba(201,168,76,0.82)', letterSpacing: '0.18em' }}>
          星月塔罗
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Stage hint */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stageHint}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            textAlign: 'center', fontSize: 12,
            color: 'rgba(205,190,162,0.72)', letterSpacing: '0.12em',
            marginBottom: 8, flexShrink: 0, position: 'relative', zIndex: 2,
          }}
        >
          {stageHint}
        </motion.p>
      </AnimatePresence>

      {/* Main content */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1, minHeight: 0,
          overflowY: state.step === 'reading' ? 'auto' : 'hidden',
          overflowX: 'hidden',
          position: 'relative', zIndex: 2,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <AnimatePresence mode="wait">

          {/* STAGE 1 */}
          {sceneStage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IntroMagicCircle
                summonProgress={gesture.summonProgress ?? 0}
                didCircleSummon={gesture.didCircleSummon}
                onClick={goToPreview}
              />
            </motion.div>
          )}

          {/* STAGE 2 */}
          {sceneStage === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              <PreviewScene
                rotation={previewRotation}
                confirmProgress={previewConfirmProgress}
              />
            </motion.div>
          )}

          {/* STAGE 3 */}
          {sceneStage === 'select' && state.step === 'selecting' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                height: '100%', minHeight: 680, padding: '24px 28px 40px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
              }}
            >
              {/* Chosen slots */}
              <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', minHeight: 124, flexShrink: 0 }}>
                {Array.from({ length: 3 }).map((_, idx) => {
                  const chosen = state.chosenCards[idx];
                  return (
                    <div key={idx} style={{
                      width: 82, height: 124, borderRadius: 14,
                      border: chosen ? '1.5px solid rgba(255,225,140,0.78)' : '1px dashed rgba(201,168,76,0.22)',
                      background: chosen ? 'linear-gradient(180deg, rgba(255,225,140,0.16), rgba(120,84,180,0.16))' : 'rgba(255,255,255,0.02)',
                      boxShadow: chosen ? '0 0 34px rgba(255,225,140,0.34), inset 0 0 24px rgba(255,225,140,0.10)' : 'none',
                      transform: chosen ? 'translateY(-6px) scale(1.07)' : 'none',
                      transition: 'all 0.25s ease',
                    }} />
                  );
                })}
              </div>

              {/* Card grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(110px, 1fr))',
                gap: 18, width: 'min(980px, 100%)',
                justifyItems: 'center', alignItems: 'center',
              }}>
                {state.availableCards.map((card, i) => {
                  // null = selected, show empty glowing slot
                  if (!card) {
                    return (
                      <div
                        key={`empty-${i}`}
                        ref={(el) => { cardRefs.current[i] = el; }}
                        style={{
                          width: 110, height: 162,
                          borderRadius: 16,
                          border: '1px solid rgba(255,225,140,0.25)',
                          background: 'radial-gradient(circle at center, rgba(255,225,140,0.06), transparent 70%)',
                          boxShadow: '0 0 18px rgba(255,225,140,0.12) inset',
                          opacity: 0.5,
                        }}
                      />
                    );
                  }
                  const isHovered = state.focusedIndex === i;
                  return (
                    <motion.div
                      key={card.card.id}
                      ref={(el) => { cardRefs.current[i] = el; }}
                      animate={{ y: isHovered ? -8 : 0, scale: isHovered ? 1.04 : 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                      style={{
                        padding: 8, borderRadius: 18,
                        background: isHovered ? 'radial-gradient(circle at center, rgba(255,225,140,0.12), rgba(120,84,180,0.08), transparent 72%)' : 'transparent',
                        boxShadow: isHovered ? '0 0 18px rgba(255,225,140,0.18)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <TarotCard card={card} isFaceUp={false} isFocused={isHovered} onClick={() => handleCardClick(i)} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STAGE 4 */}
          {(state.step === 'selected' || state.step === 'revealing' || state.step === 'reading') && state.chosenCards.length > 0 && (
            <motion.div
              key="spread"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: '100%', padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}
            >
              <div style={{ width: '100%', flexShrink: 0 }}>
                <SpreadLayout mode="three" chosenCards={state.chosenCards} flippedIndices={state.flippedIndices} onFlip={flipCard} />
              </div>
              <AnimatePresence>
                {state.step === 'reading' && (
                  aiLoading ? (
                    <motion.div
                      key="ai-loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(201,168,76,0.6)' }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ fontSize: 22, marginBottom: 14, display: 'inline-block' }}
                      >
                        ✦
                      </motion.div>
                      <div style={{ fontSize: 13, letterSpacing: '0.14em' }}>星辰正在解读命运…</div>
                    </motion.div>
                  ) : state.summary ? (
                    <ResultPanel key="result" summary={state.summary} onReset={handleReset} aiError={aiError} />
                  ) : null
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GestureIndicator gesture={gesture} />
    </div>
  );
};
