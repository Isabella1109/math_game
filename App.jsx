import React, { useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

/* ---------- Global Palette ---------- */
const COLORS = {
  softBlue: '#D7E2E8', // Buttons, accents
  paleYellow: '#FFB74D', // Highlights, correct answer glow
  softCoral: '#FF8B8B', // Incorrect feedback, reset button
  softGreen: '#A8D8B9', // OK/Answer buttons, success states
  white: '#FFFFFF',
  lightGray: '#F9FAFB', // Neutral background
  softBlack: '#374151', // Text
  mutedGray: '#9CA3AF', // Secondary text

  border: '#E5E7EB',
  card: '#FFFFFF',
  text: '#374151',
  subtext: '#9CA3AF',
  accent: '#FFB74D',
  strokeBlue: '#D7E2E8',
  strokeGreen: '#A8D8B9',

  // Added to avoid undefined background references
  bg: 'transparent',
};

const AP_COLORS = {
  bg: 'transparent',
  panel: COLORS.lightGray,
  card: COLORS.card,
  text: COLORS.text,
  subtext: COLORS.subtext,
  accent: COLORS.accent,
  softBlack: COLORS.softBlack,
  softGreen: COLORS.softGreen,
  strokeGreen: COLORS.strokeGreen,
  softBlue: COLORS.softBlue,
  strokeBlue: COLORS.strokeBlue,
  paleYellow: COLORS.paleYellow,
  softCoral: COLORS.softCoral,
  border: COLORS.border,
  borderStrong: COLORS.mutedGray,
};

const SF_COLORS = {
  bg: COLORS.lightGray,
  card: COLORS.card,
  text: COLORS.text,
  subtext: COLORS.subtext,
  accent: COLORS.accent,
  softBlack: COLORS.softBlack,
  softGreen: COLORS.softGreen,
  strokeGreen: COLORS.strokeGreen,
  border: COLORS.border,
  graySelect: COLORS.mutedGray,
};

const PATTERN_COLORS = {
  bg: 'transparent',
  card: COLORS.card,
  border: COLORS.border,
  text: COLORS.text,
  subtext: COLORS.subtext,
  accent: COLORS.accent,
  softGreen: COLORS.softGreen,
  strokeGreen: COLORS.strokeGreen,
  softBlack: COLORS.softBlack,
};

const FOOD_COLORS = COLORS;

/* ---------- Shared Header Component ---------- */
function GameHeader({ title, stars, onHome, palette }) {
  const colors = palette || COLORS;
  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <button
          onClick={onHome}
          className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1
          className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center"
          style={{ color: colors.accent }}
        >
          {title}
        </h1>

        <div
          className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
          style={{
            backgroundColor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {stars} ⭐️
        </div>
      </div>
    </div>
  );
}

/* ---------- Arrow Path Game (Game 1) ---------- */

function ArrowPathGrid({ onHome = () => {} }) {
  const gridSize = 7;
  const difficulties = {
    easy: [4, 6],
    medium: [7, 9],
    hard: [10, 12],
  };

  const [difficulty, setDifficulty] = useState('easy');
  const [path, setPath] = useState([]);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [peekOn, setPeekOn] = useState(false);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);

  const [confettiKey, setConfettiKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generatePath = () => {
    const [lo, hi] = difficulties[difficulty];
    const steps = rndInt(lo, hi);

    const pickStart = () => ({
      x: rndInt(0, gridSize - 1),
      y: rndInt(0, gridSize - 1),
    });

    const dirs = [
      { dx: 1, dy: 0, icon: '→' },
      { dx: -1, dy: 0, icon: '←' },
      { dx: 0, dy: 1, icon: '↓' },
      { dx: 0, dy: -1, icon: '↑' },
    ];

    let tries = 0;
    while (tries < 200) {
      const p = [pickStart()];
      for (let i = 0; i < steps; i++) {
        const shuffled = [...dirs];
        let moved = false;
        while (shuffled.length && !moved) {
          const k = rndInt(0, shuffled.length - 1);
          const d = shuffled.splice(k, 1)[0];
          const nx = p[p.length - 1].x + d.dx;
          const ny = p[p.length - 1].y + d.dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            p.push({ x: nx, y: ny });
            moved = true;
          }
        }
        if (!moved) break;
      }
      if (p.length === steps + 1) {
        setPath(p);
        setStart(p[0]);
        setEnd(p[p.length - 1]);
        return;
      }
      tries += 1;
    }
    // fallback
    const fb = [
      { x: 0, y: 0 },
      { x: Math.min(steps, gridSize - 1), y: 0 },
    ];
    setPath(fb);
    setStart(fb[0]);
    setEnd(fb[fb.length - 1]);
  };

  useEffect(() => {
    generatePath();
  }, [difficulty]);

  const arrows = useMemo(() => {
    const arr = [];
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const cur = path[i];
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const icon = dx === 1 ? '→' : dx === -1 ? '←' : dy === 1 ? '↓' : '↑';
      arr.push(icon);
    }
    return arr;
  }, [path]);

  const canCheck = selection !== null && !gameOver;

  const handleCheck = () => {
    if (!canCheck) return;
    const isCorrect = selection.x === end.x && selection.y === end.y;
    if (isCorrect) {
      setStatus('correct');
      setGameOver(true);
      setStars((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const handleNext = () => {
    setSelection(null);
    setStatus('idle');
    setGameOver(false);
    setPeekOn(false);
    setShowOverlay(false);
    generatePath();
  };

  const handleReset = () => {
    setSelection(null);
    setStatus('idle');
    setGameOver(false);
    setPeekOn(false);
    setShowOverlay(false);
    generatePath();
  };

  const cellState = (x, y) => {
    const isStart = x === start.x && y === start.y;
    const isEnd = x === end.x && y === end.y;
    const isSelected = selection && selection.x === x && selection.y === y;
    const isPeek = peekOn && path.some((p) => p.x === x && p.y === y);

    if (status === 'correct' && isEnd) {
      return { bg: '#A8D8B9', border: '#86C7A2' };
    }
    if (status === 'wrong' && isSelected && !isEnd) {
      return { bg: '#FF8B8B', border: '#FF8B8B' };
    }
    if (isStart) return { bg: '#FFB74D', border: '#FFB74D' };
    if (isPeek || isSelected) return { bg: '#D7E2E8', border: '#C0D2DC' };
    return { bg: '#FFFFFF', border: '#E5E7EB' };
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 pb-28 pt-4 overflow-auto"
      style={{
        backgroundColor: 'transparent',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <AnimatePresence>{status === 'correct' && <Confetti trigger={confettiKey} />}</AnimatePresence>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl space-y-4">
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center text-orange-400">
            Arrow Path Grid
          </h1>
          <div className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 bg-white border border-gray-200 text-slate-700">
            {stars} ⭐️
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          {['easy', 'medium', 'hard'].map((d) => {
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setSelection(null);
                  setStatus('idle');
                  setGameOver(false);
                  setPeekOn(false);
                  setShowOverlay(false);
                }}
                className="px-4 py-2 rounded-full text-sm font-bold transition active:scale-95 border shadow-sm"
                style={{
                  backgroundColor: active ? '#D7E2E8' : '#FFFFFF',
                  borderColor: active ? '#C0D2DC' : '#E5E7EB',
                  color: '#374151',
                }}
                aria-pressed={active}
              >
                {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
              </button>
            );
          })}
          <button
            onClick={() => setPeekOn((p) => !p)}
            className="px-4 py-2 rounded-full text-sm font-bold transition active:scale-95 border shadow-sm flex items-center gap-2"
            style={{
              backgroundColor: peekOn ? '#D7E2E8' : '#FFFFFF',
              borderColor: peekOn ? '#C0D2DC' : '#E5E7EB',
              color: '#374151',
            }}
          >
            <Eye className="w-4 h-4" />
            Peek Path
          </button>
        </div>

        {/* Arrows card */}
        <div className="space-y-2 rounded-2xl border p-3 bg-white" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 justify-center text-sm font-semibold text-slate-700">Arrows:</div>
          <div className="flex flex-wrap gap-2 p-2 rounded-xl border justify-center" style={{ borderColor: '#E5E7EB' }}>
            {arrows.length === 0 && <div className="text-sm text-gray-400">Generating...</div>}
            {arrows.map((icon, idx) => (
              <div
                key={`${icon}-${idx}`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl grid place-items-center font-bold text-lg border"
                style={{
                  backgroundColor: '#D7E2E8',
                  borderColor: '#C0D2DC',
                  color: '#374151',
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border p-3 bg-gray-50" style={{ borderColor: '#D1D5DB' }}>
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 justify-items-center">
              {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                const x = i % gridSize;
                const y = Math.floor(i / gridSize);
                const state = cellState(x, y);
                const isSelected = selection && selection.x === x && selection.y === y;
                const isStart = x === start.x && y === start.y;
                const isEnd = x === end.x && y === end.y;
                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => {
                      if (gameOver) return;
                      const wasSame = selection && selection.x === x && selection.y === y;
                      setSelection(wasSame ? null : { x, y });
                      if (status === 'wrong') setStatus('idle');
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border transition active:scale-95 shadow-sm"
                    style={{
                      backgroundColor: state.bg,
                      borderColor: state.border,
                      boxShadow: isSelected ? '0 0 0 2px #C0D2DC' : 'none',
                    }}
                  >
                    <div className="text-xs sm:text-sm font-semibold text-slate-700">
                      {isStart ? 's' : isEnd && status === 'correct' ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 w-full flex justify-center px-4 pb-4 pt-2 z-20 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait" initial={false}>
            {status === 'correct' ? (
              <motion.button
                key="next"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={handleNext}
                className="w-full py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
                style={{
                  backgroundColor: '#A8D8B9',
                  color: '#374151',
                  borderColor: '#86C7A2',
                }}
              >
                Next Question <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.div
                key="actions"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="w-full flex gap-3"
              >
                <button
                  onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#FF8B8B',
                    color: '#FFFFFF',
                    borderColor: '#FF8B8B',
                  }}
              >
                <RefreshCw className="w-5 h-5" />
                  Reset
                </button>
                <button
                  onClick={handleCheck}
                  disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                    backgroundColor: '#A8D8B9',
                    color: '#374151',
                    borderColor: '#86C7A2',
                  }}
                >
                  Check Answer <CheckCircle2 className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Number Decomposition Game (Game 2) ---------- */
const shapeTypes = ['triangle', 'square', 'circle'];

const Confetti = ({ trigger }) => {
  const particleCount = 80;
  const palette = [COLORS.strokeBlue, COLORS.softGreen, COLORS.softCoral, COLORS.accent];
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * 360 * (Math.PI / 180);
        const velocity = 15 + Math.random() * 20;
        const shapeType = Math.floor(Math.random() * 3);
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * velocity * 12,
          y: Math.sin(angle) * velocity * 12,
          rotation: Math.random() * 720,
          scale: 0.6 + Math.random() * 0.8,
          color: palette[i % palette.length],
          shapeType,
          delay: Math.random() * 0.05,
        };
      }),
    [trigger]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 600],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.8,
            ease: [0.1, 0.9, 0.3, 1],
            delay: p.delay,
          }}
          className="absolute"
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
            borderRadius: p.shapeType === 1 ? '50%' : '2px',
            borderLeft: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderRight: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderBottom: p.shapeType === 2 ? `14px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
};

function Shape({ type, color }) {
  const size = 34;
  if (type === 'triangle') {
    const base = size * 0.9;
    const height = size * 0.9;
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${base / 2}px solid transparent`,
          borderRight: `${base / 2}px solid transparent`,
          borderBottom: `${height}px solid ${color}`,
        }}
      />
    );
  }
  if (type === 'circle') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: color,
      }}
    />
  );
}

function makeOptions(total) {
  const pairs = [];
  for (let a = 1; a < total; a++) {
    const b = total - a;
    if (a <= b) pairs.push({ a, b });
  }
  if (pairs.length < 4) return null;

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  const selectedPairs = pairs.slice(0, 4);
  const correctIndex = Math.floor(Math.random() * selectedPairs.length);
  const correctPair = selectedPairs[correctIndex];

  const options = selectedPairs.map((p) => {
    const swap = Math.random() < 0.5;
    const a = swap ? p.b : p.a;
    const b = swap ? p.a : p.b;
    return { a, b };
  });

  return { correct: { a: correctPair.a, b: correctPair.b }, options };
}

function DecompositionGame({ onHome }) {
  const lastShapeRef = useRef(null);

  const createRound = (prevShape) => {
    const total = Math.floor(Math.random() * 5) + 8;
    const generated = makeOptions(total);
    if (!generated) return createRound(prevShape);

    const availableShapes = shapeTypes.filter((s) => s !== prevShape);
    const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)] || shapeTypes[0];

    return {
      total,
      shape,
      ...generated,
    };
  };

  const [round, setRound] = useState(() => {
    const initial = createRound(null);
    lastShapeRef.current = initial.shape;
    return initial;
  });
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [stars, setStars] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const canCheck = selection !== null;

  const handleCheck = () => {
    if (!canCheck) return;
    const chosen = round.options[selection];
    const isCorrect = (() => {
      const ca = Math.min(chosen.a, chosen.b);
      const cb = Math.max(chosen.a, chosen.b);
      const ra = Math.min(round.correct.a, round.correct.b);
      const rb = Math.max(round.correct.a, round.correct.b);
      return ca === ra && cb === rb;
    })();

    if (isCorrect) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiKey((k) => k + 1);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const newRound = () => {
    const next = createRound(lastShapeRef.current);
    lastShapeRef.current = next.shape;
    setRound(next);
    setSelection(null);
    setStatus('idle');
    setShowOverlay(false);
  };

  const handleReset = () => {
    setSelection(null);
    setStatus('idle');
    setShowOverlay(false);
  };

  useEffect(() => {
    if (status === 'wrong') setStatus('idle');
  }, [selection]);

  return (
    <div
      className="h-screen w-full flex justify-center px-3 sm:px-4 md:px-6 pb-20 pt-6 relative overflow-hidden"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <AnimatePresence>{status === 'correct' && <Confetti trigger={confettiKey} />}</AnimatePresence>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md md:max-w-lg space-y-4 relative z-10">
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center"
            style={{ color: COLORS.accent }}
          >
            Number Decomposition
          </h1>

          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{
              backgroundColor: COLORS.card,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {stars} ⭐️
          </div>
        </div>

        <div className="text-center text-base font-semibold leading-snug" style={{ color: COLORS.subtext }}>
          Tap the strip that shows {round.correct.a} + {round.correct.b} = {round.total}.
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {round.options.map((opt, idx) => {
              const isSelected = selection === idx;
              const isCorrect =
                status === 'correct' &&
                Math.min(opt.a, opt.b) === Math.min(round.correct.a, round.correct.b) &&
                Math.max(opt.a, opt.b) === Math.max(round.correct.a, round.correct.b);
              const isWrongSel = status === 'wrong' && isSelected;
              const bg =
                isCorrect ? COLORS.softGreen : isWrongSel ? COLORS.softCoral : isSelected ? COLORS.softBlue : COLORS.white;
              const border = isCorrect
                ? COLORS.strokeGreen
                : isWrongSel
                ? COLORS.softCoral
                : isSelected
                ? COLORS.strokeBlue
                : 'transparent';

              return (
                <button
                  key={`${opt.a}-${opt.b}-${idx}`}
                  onClick={() => setSelection(idx)}
                  className="w-full rounded-xl border shadow-sm px-3 py-5 md:py-6 flex items-center justify-center transition active:scale-95"
                  style={{
                    backgroundColor: bg,
                    borderColor: border,
                    color: COLORS.text,
                    minHeight: '150px',
                  }}
                >
                  <div className="flex items-center flex-wrap gap-2 justify-center">
                    {Array.from({ length: opt.a }).map((_, i) => (
                      <Shape key={`a-${i}`} type={round.shape} color="#EC4899" />
                    ))}
                    {Array.from({ length: opt.b }).map((_, i) => (
                      <Shape key={`b-${i}`} type={round.shape} color="#3B82F6" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={newRound}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: COLORS.softGreen,
                color: COLORS.softBlack,
                borderColor: COLORS.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: COLORS.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softGreen,
                  color: COLORS.softBlack,
                  borderColor: COLORS.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Shape Finder Game (Game 3) ---------- */
const SF_PALETTE = [
  COLORS.accent,
  '#8B5CF6',
  '#22C55E',
  '#38BDF8',
  '#FACC15',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
];

const SF_TARGETS = [
  { key: 'triangle', label: 'Triangles' },
  { key: 'circle', label: 'Circles' },
  { key: 'square', label: 'Squares' },
  { key: 'rectangle', label: 'Rectangles' },
  { key: 'diamond', label: 'Diamonds' },
  { key: 'trapezoid', label: 'Trapezoids' },
  { key: 'parallelogram', label: 'Parallelograms' },
];

const SF_SHAPES = [
  {
    type: 'triangle',
    clip: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    radius: '0px',
  },
  { type: 'square', clip: 'none', radius: '0px' },
  { type: 'circle', clip: 'none', radius: '9999px' },
  { type: 'rectangle', clip: 'none', radius: '0px' },
  {
    type: 'diamond',
    clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    radius: '0px',
  },
  {
    type: 'trapezoid',
    clip: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
    radius: '0px',
  },
  {
    type: 'parallelogram',
    clip: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
    radius: '0px',
  },
];

function sfShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SFConfetti({ trigger }) {
  const particleCount = 90;
  const paletteConfetti = [COLORS.softBlue, COLORS.paleYellow, COLORS.softCoral, COLORS.softGreen];
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * 360 * (Math.PI / 180);
        const velocity = 15 + Math.random() * 20;
        const shapeType = Math.floor(Math.random() * 3);
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * velocity * 12,
          y: Math.sin(angle) * velocity * 12,
          rotation: Math.random() * 720,
          scale: 0.6 + Math.random() * 0.8,
          color: paletteConfetti[i % paletteConfetti.length],
          shapeType,
          delay: Math.random() * 0.05,
        };
      }),
    [trigger]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 600],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.8,
            ease: [0.1, 0.9, 0.3, 1],
            delay: p.delay,
          }}
          className="absolute"
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
            borderRadius: p.shapeType === 1 ? '50%' : '2px',
            borderLeft: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderRight: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderBottom: p.shapeType === 2 ? `14px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function ShapeCard({ shape, selected }) {
  const fillColor = selected ? SF_COLORS.graySelect : shape.color;
  const width = shape.w || shape.size;
  const height = shape.h || shape.size;

  return (
    <div className="transition transform active:scale-95" style={{ width, height }}>
      <div
        className="w-full h-full"
        style={{
          backgroundColor: fillColor,
          clipPath: shape.clip !== 'none' ? shape.clip : undefined,
          borderRadius: shape.radius || '0px',
          transform: `rotate(${shape.rotate}deg) translate(${shape.jitterX}px, ${shape.jitterY}px)`,
          boxShadow: 'none',
        }}
      />
    </div>
  );
}

function generatePuzzle(target) {
  const shapes = [];
  const requiredTarget = 4;
  const requiredNonTarget = 8;
  const total = 16;

  const pickShape = (mustBeTarget) => {
    const pool = mustBeTarget ? SF_SHAPES.filter((s) => s.type === target) : SF_SHAPES.filter((s) => s.type !== target);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  for (let i = 0; i < requiredTarget; i += 1) shapes.push(pickShape(true));
  for (let i = 0; i < requiredNonTarget; i += 1) shapes.push(pickShape(false));
  while (shapes.length < total) shapes.push(SF_SHAPES[Math.floor(Math.random() * SF_SHAPES.length)]);

  const colored = sfShuffle(shapes).map((s, idx) => {
    const base = 56 + Math.floor(Math.random() * 28);
    const rectRatio = 1.35 + Math.random() * 0.25;
    const isRect = s.type === 'rectangle';
    const w = isRect ? Math.round(base * rectRatio) : base;
    const h = isRect ? base : base;
    const size = base;

    return {
      id: `shape-${Date.now()}-${idx}`,
      type: s.type,
      clip: s.clip,
      radius: s.radius,
      color: SF_PALETTE[idx % SF_PALETTE.length],
      size: `${size}px`,
      w: `${w}px`,
      h: `${h}px`,
      rotate: (Math.random() * 20 - 10).toFixed(1),
      jitterX: Math.random() * 6 - 3,
      jitterY: Math.random() * 6 - 3,
    };
  });

  return colored;
}
function ShapeFinderGame({ onHome }) {
  const colors = SF_COLORS;
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [stars, setStars] = useState(0);
  const [confettiId, setConfettiId] = useState(0);
  const [target, setTarget] = useState(SF_TARGETS[0]);
  const [showOverlay, setShowOverlay] = useState(false);

  const correctIds = useMemo(
    () => shapes.filter((s) => s.type !== target.key).map((s) => s.id),
    [shapes, target]
  );

  const startRound = () => {
    const newTarget = SF_TARGETS[Math.floor(Math.random() * SF_TARGETS.length)];
    setTarget(newTarget);
    setShapes(generatePuzzle(newTarget.key));
    setSelectedIds([]);
    setStatus('idle');
    setShowOverlay(false);
  };

  useEffect(() => {
    startRound();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
    if (status !== 'idle') setStatus('idle');
  };

  const handleCheck = () => {
    const selSet = new Set(selectedIds);
    const corSet = new Set(correctIds);
    const allMatch = selSet.size === corSet.size && Array.from(corSet).every((id) => selSet.has(id));

    if (allMatch) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiId((c) => c + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const canCheck = selectedIds.length > 0;

  useEffect(() => {
    if (status === 'wrong') setStatus('idle');
  }, [selectedIds, status]);

  return (
    <div
      className="min-h-screen w-full flex justify-center px-4 pb-24 pt-4"
      style={{
        backgroundColor: 'transparent',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      {status === 'correct' && <SFConfetti trigger={confettiId} />}

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl space-y-4 relative">
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center"
            style={{ color: colors.accent }}
          >
            Shape Finder
          </h1>

          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {stars} ⭐️
          </div>
        </div>

        <div
          className="rounded-3xl shadow-sm p-4 space-y-4"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        >
          <div className="w-full flex flex-col items-center text-center space-y-3">
            <div className="text-base font-semibold leading-snug max-w-2xl" style={{ color: colors.subtext }}>
              Find shapes that are <span style={{ color: colors.accent }}>not {target.label.toLowerCase()}</span>.
            </div>
          </div>

          <div className="w-full flex flex-wrap justify-center items-center gap-3">
            {shapes.map((shape) => {
              const selected = selectedIds.includes(shape.id);
              return (
                <button
                  key={shape.id}
                  onClick={() => toggleSelect(shape.id)}
                  className="text-left"
                  aria-pressed={selected}
                  style={{ padding: 4 }}
                >
                  <ShapeCard shape={shape} selected={selected} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>

      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={startRound}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: colors.softGreen,
                color: colors.softBlack,
                borderColor: colors.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={startRound}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: colors.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.softGreen,
                  color: colors.softBlack,
                  borderColor: colors.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Complete the Pattern Game (Game 4) ---------- */

const EMOJIS = ['🌸', '⭐️', '🐠', '🐶', '🐳', '🐸', '🌼', '🍏', '🍒', '🍔', '🍓', '🍕', '🍬'];

function PatternConfetti({ trigger }) {
  const particleCount = 70;
  const palette = [COLORS.softBlue, COLORS.paleYellow, COLORS.softCoral, COLORS.softGreen];
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const velocity = 9 + Math.random() * 14;
        const shapeType = Math.floor(Math.random() * 3);
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * velocity * 18,
          y: Math.sin(angle) * velocity * 18,
          rotation: Math.random() * 720,
          scale: 0.6 + Math.random() * 0.9,
          color: palette[i % palette.length],
          shapeType,
          delay: Math.random() * 0.08,
        };
      }),
    [trigger]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.05],
            y: [0, p.y, p.y + 520],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.6,
            ease: [0.1, 0.9, 0.3, 1],
            delay: p.delay,
          }}
          className="absolute"
          style={{
            width: 12,
            height: 12,
            backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
            borderRadius: p.shapeType === 1 ? '9999px' : '3px',
            borderLeft: p.shapeType === 2 ? '6px solid transparent' : 'none',
            borderRight: p.shapeType === 2 ? '6px solid transparent' : 'none',
            borderBottom: p.shapeType === 2 ? `12px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function sampleDistinct(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  const copy = [...pool];
  const picked = [];
  while (picked.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PATTERN_TEMPLATES = ['AB', 'ABC', 'AAB', 'ABB', 'AABB'];

function makeQuestion({ hideInMiddle }) {
  const template = PATTERN_TEMPLATES[Math.floor(Math.random() * PATTERN_TEMPLATES.length)];
  const letters = template.split('');
  const uniqueLetters = Array.from(new Set(letters));

  const picked = sampleDistinct(EMOJIS, uniqueLetters.length);
  const mapping = {};
  uniqueLetters.forEach((letter, idx) => {
    mapping[letter] = picked[idx];
  });

  let visibleLen;
  if (hideInMiddle) {
    visibleLen = randInt(7, 9);
  } else {
    visibleLen = randInt(5, 7);
  }
  const totalLen = visibleLen + 1;
  const hideIndex = hideInMiddle ? Math.floor(totalLen / 2) : totalLen - 1;

  const pattern = [];
  for (let i = 0; i < totalLen; i++) {
    const letter = letters[i % letters.length];
    pattern.push(mapping[letter]);
  }

  const hidden = pattern[hideIndex];
  const choices = shuffle([hidden, ...sampleDistinct(EMOJIS, 3, [hidden])]);

  return {
    prompt: 'Which emoji completes the pattern?',
    pattern,
    hideIndex,
    hidden,
    choices,
  };
}

function EmojiPatternGame({ onHome }) {
  const colors = PATTERN_COLORS;
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion({ hideInMiddle: false }));
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [confettiId, setConfettiId] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const stars = totalCorrect;
  const isCorrect = status === 'correct';

  const newQuestion = () => {
    const hideInMiddle = streak >= 10;
    setQuestion(makeQuestion({ hideInMiddle }));
    setSelection(null);
    setStatus('idle');
    setShowOverlay(false);
  };

  const checkAnswer = () => {
    if (!selection) return;
    const ok = selection === question.hidden;
    if (ok) {
      setStatus('correct');
      setStreak((s) => s + 1);
      setTotalCorrect((c) => c + 1);
      setConfettiId((c) => c + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setStreak(0);
      setShowOverlay(true);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center px-4 pb-24 pt-6"
      style={{
        backgroundColor: 'transparent',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      {isCorrect && <PatternConfetti trigger={confettiId} />}

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl space-y-4 relative">
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-center"
            style={{ color: colors.accent }}
          >
            Complete the Pattern
          </h1>

          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {stars} ⭐️
          </div>
        </div>

        <div className="rounded-3xl p-4 space-y-4 shadow-sm" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <p className="text-base font-semibold" style={{ color: colors.text }}>
            {question.prompt}
          </p>

          <div className="w-full rounded-2xl border p-4 flex flex-wrap items-center gap-3" style={{ borderColor: colors.border }}>
            {question.pattern.map((emoji, i) =>
              i === question.hideIndex ? (
                <div
                  key={`missing-${i}`}
                  className="w-14 h-14 border-2 border-dashed rounded-2xl flex items-center justify-center"
                  style={{ borderColor: colors.border }}
                  aria-label="Empty box"
                />
              ) : (
                <div
                  key={`${emoji}-${i}`}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {emoji}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {question.choices.map((choiceEmoji, idx) => {
              const selected = selection === choiceEmoji;
              const wrongSelected = status === 'wrong' && selected;
              return (
                <button
                  key={`${choiceEmoji}-${idx}`}
                  onClick={() => {
                    if (selection === choiceEmoji) {
                      setSelection(null);
                      setStatus('idle');
                      setShowOverlay(false);
                    } else {
                      setSelection(choiceEmoji);
                      setStatus('idle');
                      setShowOverlay(false);
                    }
                  }}
                  className="w-full rounded-2xl border p-4 flex items-center justify-center transition-transform active:scale-95"
                  style={{
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected ? COLORS.lightGray : colors.card,
                  }}
                  aria-label={`Choice ${idx + 1}`}
                >
                  <span className="text-4xl" style={{ opacity: wrongSelected ? 0.4 : 1 }}>
                    {choiceEmoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {isCorrect ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={newQuestion}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: colors.softGreen,
                color: colors.softBlack,
                borderColor: colors.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={newQuestion}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: colors.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={checkAnswer}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.softGreen,
                  color: colors.softBlack,
                  borderColor: colors.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Count the Food Game (Game 5) ---------- */
const CATEGORY_POOL = [
  { key: 'apple', label: 'Apples', emoji: '🍎' },
  { key: 'banana', label: 'Bananas', emoji: '🍌' },
  { key: 'grape', label: 'Grapes', emoji: '🍇' },
  { key: 'burger', label: 'Burgers', emoji: '🍔' },
  { key: 'pizza', label: 'Pizza', emoji: '🍕' },
  { key: 'carrot', label: 'Carrots', emoji: '🥕' },
];

/* Confetti */
function FoodConfetti({ trigger }) {
  const particleCount = 80;
  const palette = [
    FOOD_COLORS.strokeBlue,
    FOOD_COLORS.softGreen,
    FOOD_COLORS.softCoral,
    FOOD_COLORS.accent,
  ];
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * 360 * (Math.PI / 180);
        const velocity = 15 + Math.random() * 20;
        const shapeType = Math.floor(Math.random() * 3);
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * velocity * 12,
          y: Math.sin(angle) * velocity * 12,
          rotation: Math.random() * 720,
          scale: 0.6 + Math.random() * 0.8,
          color: palette[i % palette.length],
          shapeType,
          delay: Math.random() * 0.05,
        };
      }),
    [trigger]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 600],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.8,
            ease: [0.1, 0.9, 0.3, 1],
            delay: p.delay,
          }}
          className="absolute"
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
            borderRadius: p.shapeType === 1 ? '50%' : '2px',
            borderLeft: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderRight: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderBottom: p.shapeType === 2 ? `14px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* Game */
function CountThreeFoodsGame({ onHome = () => {} }) {
  const [roundCats, setRoundCats] = useState([]);
  const [items, setItems] = useState([]);
  const [correctCounts, setCorrectCounts] = useState({});
  const [options, setOptions] = useState({});
  const [selections, setSelections] = useState({});
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [stars, setStars] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const isCorrect = status === 'correct';

  const randIntLocal = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const shuffleLocal = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randIntLocal(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildOptions = (correct) => {
    const set = new Set([correct]);
    while (set.size < 4) {
      const delta = randIntLocal(-2, 3);
      const candidate = Math.max(2, correct + delta);
      set.add(candidate);
    }
    return Array.from(set).sort((a, b) => a - b);
  };

  // Total items = 20 to avoid create an orphan in a 5-col grid
  const TARGET_TOTAL = 20;

  const generateRound = () => {
    const chosen = shuffleLocal(CATEGORY_POOL).slice(0, 3);

    const minPerCat = 5;
    const baseTotal = minPerCat * 3; // 15
    let remaining = TARGET_TOTAL - baseTotal; // 5

    const extras = [0, 0, 0];
    while (remaining > 0) {
      const idx = randIntLocal(0, 2);
      extras[idx] += 1;
      remaining -= 1;
    }

    const counts = {};
    chosen.forEach((cat, idx) => {
      counts[cat.key] = minPerCat + extras[idx];
    });

    const builtOptions = {};
    chosen.forEach((cat) => {
      builtOptions[cat.key] = buildOptions(counts[cat.key]);
    });

    const allItems = [];
    chosen.forEach((cat) => {
      for (let i = 0; i < counts[cat.key]; i++) {
        allItems.push({ id: `${cat.key}-${i}`, cat: cat.key, tapped: false });
      }
    });

    setRoundCats(chosen);
    setCorrectCounts(counts);
    setOptions(builtOptions);
    setSelections(chosen.reduce((acc, c) => ({ ...acc, [c.key]: null }), {}));
    setItems(shuffleLocal(allItems));
    setStatus('idle');
    setShowOverlay(false);
  };

  useEffect(() => {
    generateRound();
  }, []);

  const canCheck =
    roundCats.length === 3 &&
    roundCats.every((c) => selections[c.key] !== null);

  const handleCheck = () => {
    if (!canCheck) return;
    const allCorrect = roundCats.every(
      (c) => selections[c.key] === correctCounts[c.key]
    );
    if (allCorrect) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const handleNext = () => generateRound();
  const handleReset = () => generateRound();

  const optionStyle = (catKey, val) => {
    const isSelected = selections[catKey] === val;
    const base = {
      backgroundColor: FOOD_COLORS.white,
      borderColor: 'transparent',
      color: FOOD_COLORS.text,
    };
    if (status === 'correct' && val === correctCounts[catKey]) {
      return {
        ...base,
        backgroundColor: FOOD_COLORS.softGreen,
        borderColor: FOOD_COLORS.softGreen,
      };
    }
    if (status === 'wrong' && isSelected && val !== correctCounts[catKey]) {
      return {
        ...base,
        backgroundColor: FOOD_COLORS.softCoral,
        borderColor: FOOD_COLORS.softCoral,
      };
    }
    if (isSelected) {
      return {
        ...base,
        backgroundColor: FOOD_COLORS.softBlue,
        borderColor: FOOD_COLORS.softBlue,
      };
    }
    return base;
  };

  const toggleItemTap = (idx) => {
    setItems((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      next[idx] = { ...next[idx], tapped: !next[idx].tapped };
      return next;
    });
  };

  const toggleSelectAnswer = (catKey, val) => {
    setSelections((prev) => {
      const current = prev[catKey];
      return { ...prev, [catKey]: current === val ? null : val };
    });
    if (status === 'wrong') setStatus('idle');
  };

  return (
    <div
      className="h-screen w-full flex justify-center items-start px-3 pb-4 pt-4 overflow-hidden"
      style={{
        backgroundColor: 'transparent',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      {isCorrect && <FoodConfetti trigger={confettiKey} />}

      <AnimatePresence>
        {status === 'correct' && <Confetti trigger={confettiKey} />}
      </AnimatePresence>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl space-y-3 relative flex flex-col overflow-hidden">
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1
            className="text-lg font-bold text-center absolute left-1/2 -translate-x-1/2"
            style={{ color: FOOD_COLORS.accent }}
          >
            Count the Food
          </h1>
          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{
              backgroundColor: FOOD_COLORS.card,
              color: FOOD_COLORS.text,
              border: `1px solid ${FOOD_COLORS.border}`,
            }}
          >
            {stars} ⭐️
          </div>
        </div>

        <div
          className="rounded-3xl shadow-sm p-4 md:p-5 space-y-4 relative overflow-hidden w-full flex-1 flex flex-col"
          style={{
            backgroundColor: FOOD_COLORS.card,
            border: `1px solid ${FOOD_COLORS.border}`,
          }}
        >
          <div
            className="w-full rounded-2xl border p-3 md:p-4 flex-1 flex flex-col gap-3"
            style={{
              backgroundColor: FOOD_COLORS.white,
              borderColor: FOOD_COLORS.white,
            }}
          >
            <div
              className="text-center text-sm md:text-base"
              style={{ color: FOOD_COLORS.subtext }}
            >
              Tap and count, then choose the totals below.
            </div>

            <div
              className="rounded-2xl border p-3 grid grid-cols-5 gap-2 justify-items-center"
              style={{
                borderColor: FOOD_COLORS.softBlue,
                backgroundColor: FOOD_COLORS.card,
              }}
            >
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => toggleItemTap(i)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition shadow-sm border active:scale-95"
                  style={{
                    backgroundColor: it.tapped
                      ? FOOD_COLORS.softBlue
                      : FOOD_COLORS.white,
                    color: FOOD_COLORS.softBlack,
                    borderColor: it.tapped ? FOOD_COLORS.softBlue : 'transparent',
                  }}
                >
                  {roundCats.find((c) => c.key === it.cat)?.emoji || '❓'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {roundCats.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: FOOD_COLORS.softBlack }}
                  >
                    {cat.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(options[cat.key] || []).map((val) => (
                    <button
                      key={val}
                      onClick={() => toggleSelectAnswer(cat.key, val)}
                      className="py-3 rounded-xl text-lg font-semibold border shadow-sm transition active:scale-95"
                      style={optionStyle(cat.key, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-3 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={handleNext}
              className="w-full max-w-xl py-3 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: FOOD_COLORS.softGreen,
                color: FOOD_COLORS.softBlack,
                borderColor: FOOD_COLORS.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: FOOD_COLORS.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: FOOD_COLORS.softGreen,
                  color: FOOD_COLORS.softBlack,
                  borderColor: FOOD_COLORS.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Number Groups Game (Game 6) ---------- */
const NG_TARGETS = [10, 15, 20, 25, 30];
const NG_GROUP_SIZES = [2, 5, 10];
const NG_EMOJIS = ['🐶', '🐱', '🐰', '🐣', '🐢', '🐮', '🦊', '🐼', '🐧', '🐙', '🐝', '🦄'];
const NG_GROUP_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0', '#FDE2E4', '#E0E7FF'];

function NumberGroupsGame({ onHome }) {
  const palette = {
    ...COLORS,
    bg: COLORS.lightGray,
  };

  const [groupSize, setGroupSize] = useState(5);
  const [target, setTarget] = useState(10);
  const [emoji, setEmoji] = useState('🐶');
  const [animals, setAnimals] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [animalsAnswer, setAnimalsAnswer] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [stars, setStars] = useState(0);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPath, setDragPath] = useState([]);
  const [animalCenters, setAnimalCenters] = useState({});
  const gridRef = useRef(null);

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[randInt(0, arr.length - 1)];
  const makeAnimalOptions = (correct) => {
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const delta = pick([-5, 5, -10, 10]);
      const cand = Math.max(5, correct + delta);
      if (cand <= 35) opts.add(cand);
    }
    return Array.from(opts).sort((a, b) => a - b);
  };

  const [animalOptions, setAnimalOptions] = useState(makeAnimalOptions(10));

  const startRound = (size = groupSize) => {
    const allowedTargets = NG_TARGETS.filter((t) => t % size === 0);
    const chosenTarget = pick(allowedTargets.length ? allowedTargets : NG_TARGETS);
    const newEmoji = pick(NG_EMOJIS);
    const list = Array.from({ length: chosenTarget }, (_, i) => ({
      id: i,
      grouped: false,
      groupId: null,
    }));
    setTarget(chosenTarget);
    setEmoji(newEmoji);
    setAnimals(list);
    setSelectedIds([]);
    setGroups([]);
    setAnimalsAnswer(null);
    setStatus('idle');
    setAnimalOptions(makeAnimalOptions(chosenTarget));
    setDragPath([]);
    setIsDragging(false);
  };

  useEffect(() => {
    startRound(groupSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const buttons = gridRef.current.querySelectorAll('[data-animal-id]');
    const centers = {};
    buttons.forEach((btn) => {
      const id = Number(btn.dataset.animalId);
      const b = btn.getBoundingClientRect();
      centers[id] = {
        x: b.left - rect.left + b.width / 2,
        y: b.top - rect.top + b.height / 2,
        box: { left: b.left - rect.left, top: b.top - rect.top, width: b.width, height: b.height },
      };
    });
    setAnimalCenters(centers);
  }, [animals, target]);

  const groupedCount = animals.filter((a) => a.grouped).length;
  const allGrouped = groupedCount === target && selectedIds.length === 0;
  const answersChosen = animalsAnswer !== null;
  const canCheck = allGrouped && answersChosen;

  const NGConfettiBurst = () => {
    const particleCount = 80;
    const paletteColors = [palette.strokeBlue, palette.paleYellow, palette.softCoral, palette.softGreen];
    const particles = useMemo(
      () =>
        Array.from({ length: particleCount }).map((_, i) => {
          const angle = Math.random() * 360 * (Math.PI / 180);
          const velocity = 15 + Math.random() * 20;
          const shapeType = Math.floor(Math.random() * 3);
          return {
            id: `${confettiBurst}-${i}`,
            x: Math.cos(angle) * velocity * 12,
            y: Math.sin(angle) * velocity * 12,
            rotation: Math.random() * 720,
            scale: 0.6 + Math.random() * 0.8,
            color: paletteColors[i % paletteColors.length],
            shapeType,
            delay: Math.random() * 0.05,
          };
        }),
      [confettiBurst]
    );
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, p.x, p.x * 1.1],
              y: [0, p.y, p.y + 600],
              scale: [0, p.scale, p.scale, 0],
              rotate: [0, p.rotation],
              opacity: [1, 1, 1, 0],
            }}
            transition={{ duration: 2.8, ease: [0.1, 0.9, 0.3, 1], delay: p.delay }}
            className="absolute"
            style={{
              width: '14px',
              height: '14px',
              backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
              borderRadius: p.shapeType === 1 ? '50%' : '2px',
              borderLeft: p.shapeType === 2 ? '7px solid transparent' : 'none',
              borderRight: p.shapeType === 2 ? '7px solid transparent' : 'none',
              borderBottom: p.shapeType === 2 ? `14px solid ${p.color}` : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  const finalizeGroup = (selIds) => {
    if (selIds.length !== groupSize) return;
    const newGroupId = groups.length;
    setAnimals((prev) => prev.map((a) => (selIds.includes(a.id) ? { ...a, grouped: true, groupId: newGroupId } : a)));
    setGroups((prev) => [...prev, { id: newGroupId }]);
    setSelectedIds([]);
    setDragPath([]);
    setIsDragging(false);
    if (status === 'wrong') setStatus('idle');
  };

  const hitTestId = (px, py) => {
    for (const [id, c] of Object.entries(animalCenters)) {
      const { left, top, width, height } = c.box;
      if (px >= left && px <= left + width && py >= top && py <= top + height) {
        return Number(id);
      }
    }
    return null;
  };

  const addIfValid = (id) => {
    const a = animals.find((x) => x.id === id);
    if (!a || a.grouped) return;
    setSelectedIds((prev) => {
      if (prev.includes(id) || prev.length >= groupSize) return prev;
      const next = [...prev, id];
      if (next.length === groupSize) {
        setTimeout(() => finalizeGroup(next), 0);
      }
      return next;
    });
  };

  const handlePointerDown = (id, e) => {
    e.preventDefault();
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    setDragPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    addIfValid(id);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragPath((prev) => {
      const next = [...prev, { x, y }];
      return next.length > 250 ? next.slice(-250) : next;
    });
    const hitId = hitTestId(x, y);
    if (hitId !== null) addIfValid(hitId);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragPath([]);
  };
  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragPath([]);
  };

  const resetRound = () => {
    startRound();
  };

  const handleCheck = () => {
    if (status === 'correct') {
      startRound();
      return;
    }
    if (!allGrouped || !answersChosen) {
      setStatus('wrong');
      return;
    }
    const correct = animalsAnswer === target && allGrouped === true;
    if (correct) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiBurst((c) => c + 1);
    } else {
      setStatus('wrong');
    }
  };

  const animalStyle = (a) => {
    if (a.grouped) {
      const color = NG_GROUP_COLORS[a.groupId % NG_GROUP_COLORS.length];
      return {
        backgroundColor: color,
        borderColor: color,
        color: palette.text,
        touchAction: 'none',
      };
    }
    if (selectedIds.includes(a.id)) {
      return {
        backgroundColor: palette.softBlue,
        borderColor: palette.softBlue,
        color: palette.text,
        touchAction: 'none',
      };
    }
    return {
      backgroundColor: palette.card,
      borderColor: 'transparent',
      color: palette.text,
      touchAction: 'none',
    };
  };

  const optionStyle = (picked, val, correctVal) => {
    const isSelected = picked === val;
    const isCorrectStage = status === 'correct';
    const base = {
      backgroundColor: palette.card,
      borderColor: 'transparent',
      color: palette.text,
    };
    if (isCorrectStage) {
      if (val === correctVal) {
        return { ...base, backgroundColor: palette.softGreen, borderColor: palette.softGreen };
      }
      return base;
    }
    if (status === 'wrong' && isSelected && val !== correctVal) {
      return { ...base, backgroundColor: palette.softCoral, borderColor: palette.softCoral };
    }
    if (isSelected) {
      return { ...base, backgroundColor: palette.softBlue, borderColor: palette.softBlue };
    }
    return base;
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center px-3 pb-32 pt-6 relative"
      style={{
        backgroundColor: 'transparent',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {status === 'correct' && <NGConfettiBurst />}

      <div className="w-full max-w-3xl space-y-4 relative z-10">
        <GameHeader title={`Number Groups (${groupSize})`} stars={stars} onHome={onHome} palette={palette} />

        <div className="flex gap-2">
          {NG_GROUP_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => {
                setGroupSize(size);
                startRound(size);
              }}
              className="flex-1 py-2 rounded-xl font-semibold border shadow-sm transition active:scale-95"
              style={{
                backgroundColor: groupSize === size ? palette.softBlue : palette.card,
                borderColor: groupSize === size ? palette.softBlue : palette.border,
                color: palette.text,
              }}
            >
              Groups of {size}
            </button>
          ))}
        </div>

        <div className="rounded-3xl shadow-sm p-4 space-y-4 relative overflow-hidden" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
          <div className="text-center text-base font-semibold leading-snug" style={{ color: palette.subtext }}>
            Drag across the {emoji} to make groups of {groupSize}.
          </div>

          <div
            ref={gridRef}
            className="relative rounded-2xl border p-3 grid grid-cols-5 sm:grid-cols-6 gap-3 touch-none select-none"
            style={{ borderColor: palette.border, backgroundColor: palette.bg }}
            onPointerMove={handlePointerMove}
          >
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
              {dragPath.length > 1 && (
                <polyline
                  points={dragPath.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={palette.strokeBlue}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                />
              )}
            </svg>

            {animals.map((a) => (
              <button
                key={a.id}
                data-animal-id={a.id}
                onPointerDown={(e) => handlePointerDown(a.id, e)}
                className="w-14 h-14 rounded-full border shadow-sm flex items-center justify-center text-2xl transition active:scale-95 touch-none select-none"
                style={animalStyle(a)}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-lg font-semibold text-center" style={{ color: palette.text }}>
              How many {emoji} in total?
            </div>
            <div className="grid grid-cols-4 gap-2">
              {animalOptions.map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setAnimalsAnswer((prev) => (prev === val ? null : val));
                    if (status === 'wrong') setStatus('idle');
                  }}
                  className="py-3 rounded-xl text-lg font-semibold border shadow-sm transition active:scale-95"
                  style={optionStyle(animalsAnswer, val, target)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={() => startRound()}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: palette.softGreen,
                color: palette.softBlack,
                borderColor: palette.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={resetRound}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: palette.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: palette.softGreen,
                  color: palette.softBlack,
                  borderColor: palette.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status === 'wrong' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            onClick={() => setStatus('idle')}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="rounded-2xl px-6 py-4 shadow-lg text-center border"
              style={{
                backgroundColor: palette.card,
                borderColor: palette.border,
                color: palette.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-bold" style={{ color: palette.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Number Combination Game (Game 7) ---------- */

const NC_COLORS = {
  bg: '#F9FAFB',
  card: 'rgba(229,231,235,0.3)',
  white: '#FFFFFF',
  text: '#374151',
  subtext: '#6B7280',
  accent: '#F97316',
  softBlack: '#1F2937',
  softGreen: '#C5E6CF',
  strokeGreen: '#8BC6A0',
  softCoral: '#FF8B8B',
  border: '#E5E7EB',
};

const NC_NAMES = ['Amy', 'Carman', 'Jessica', 'Peter', 'John', 'Chester', 'Oscar', 'Bella'];

const NC_ITEMS = [
  { container: 'bags', noun: 'candies', emoji: '🍬' },
  { container: 'boxes', noun: 'pizza', emoji: '🍕' },
  { container: 'bags', noun: 'cookies', emoji: '🍪' },
  { container: 'boxes', noun: 'cookies', emoji: '🍪' },
  { container: 'boxes', noun: 'shells', emoji: '🐚' },
  { container: 'boxes', noun: 'strawberries', emoji: '🍓' },
  { container: 'bags', noun: 'croissants', emoji: '🥐' },
  { container: 'boxes', noun: 'fish', emoji: '🐠' },
];

const ncPronoun = (name) => {
  const she = ['Amy', 'Carman', 'Jessica', 'Bella'];
  return she.includes(name) ? { subj: 'She', obj: 'her' } : { subj: 'He', obj: 'his' };
};

const ncShuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const NCConfetti = ({ trigger }) => {
  const particleCount = 80;
  const palette = ['#8AB7E6', '#F9E6A0', '#F9C0C0', '#8BC6A0'];
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * 360 * (Math.PI / 180);
        const velocity = 15 + Math.random() * 20;
        const shapeType = Math.floor(Math.random() * 3);
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * velocity * 12,
          y: Math.sin(angle) * velocity * 12,
          rotation: Math.random() * 720,
          scale: 0.6 + Math.random() * 0.8,
          color: palette[i % palette.length],
          shapeType,
          delay: Math.random() * 0.05,
        };
      }),
    [trigger]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 600],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0],
          }}
          transition={{ duration: 2.8, ease: [0.1, 0.9, 0.3, 1], delay: p.delay }}
          className="absolute"
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: p.shapeType !== 2 ? p.color : 'transparent',
            borderRadius: p.shapeType === 1 ? '50%' : '2px',
            borderLeft: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderRight: p.shapeType === 2 ? '7px solid transparent' : 'none',
            borderBottom: p.shapeType === 2 ? `14px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
};

function ncBuildRound() {
  const target = 7 + Math.floor(Math.random() * 4); // 7..10
  const name = NC_NAMES[Math.floor(Math.random() * NC_NAMES.length)];
  const item = NC_ITEMS[Math.floor(Math.random() * NC_ITEMS.length)];
  const pro = ncPronoun(name);

  // Correct pair: both >= 2, different, sum to target
  let partA, partB;
  let guard = 0;
  do {
    partA = 2 + Math.floor(Math.random() * (target - 3)); // 2..(target-2)
    partB = target - partA;
    guard++;
  } while ((partA === partB || partB < 2) && guard < 50);

  const correctPairSorted = [partA, partB].sort((a, b) => a - b);

  const options = [partA, partB];

  // One option bigger than the target
  let overTarget = target + 1 + Math.floor(Math.random() * 3);
  while (options.includes(overTarget)) overTarget++;
  options.push(overTarget);

  // Safe-add helper: value >= 2, unique, and no pair with any existing option sums to target
  const isSafe = (n, current) => {
    if (n < 2) return false;
    if (current.includes(n)) return false;
    for (const v of current) {
      if (n + v === target) return false;
    }
    return true;
  };

  // Candidate pool (>= 2, exclude the target value itself)
  const candidates = [];
  for (let x = 2; x <= target + 5; x++) {
    if (x !== target && !options.includes(x)) candidates.push(x);
  }

  const shuffled = ncShuffle(candidates);
  for (const c of shuffled) {
    if (options.length >= 5) break;
    if (isSafe(c, options)) options.push(c);
  }

  return { name, item, pro, target, correctPairSorted, options: ncShuffle(options) };
}

function NumberCombinationGame({ onHome }) {
  const [round, setRound] = useState(ncBuildRound);
  const [selection, setSelection] = useState([]);
  const [status, setStatus] = useState('idle');
  const [stars, setStars] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const canCheck = selection.length === 2;

  const handleCardToggle = (idx) => {
    setSelection((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      if (prev.length >= 2) return [prev[prev.length - 1], idx];
      return [...prev, idx];
    });
    if (status === 'wrong') setStatus('idle');
  };

  const handleCheck = () => {
    if (!canCheck) return;
    const pickedCounts = selection.map((i) => round.options[i]).sort((a, b) => a - b);
    const isCorrect =
      pickedCounts.length === 2 &&
      pickedCounts[0] === round.correctPairSorted[0] &&
      pickedCounts[1] === round.correctPairSorted[1];
    if (isCorrect) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const handleNext = () => {
    setRound(ncBuildRound());
    setSelection([]);
    setStatus('idle');
    setShowOverlay(false);
  };

  const handleReset = () => {
    setSelection([]);
    setStatus('idle');
    setShowOverlay(false);
  };

  const questionText = `${round.name} has 2 ${round.item.container} of ${round.item.noun}. ${round.pro.subj} has ${round.target} ${round.item.noun} in total. Which two ${round.item.container} are ${round.pro.obj}?`;

  const renderCard = (idx) => {
    const count = round.options[idx];
    if (count === undefined) return null;
    const isSelected = selection.includes(idx);
    const isCorrectCard =
      status === 'correct' &&
      (count === round.correctPairSorted[0] || count === round.correctPairSorted[1]);
    const bg = isSelected
      ? '#E0EDFF'
      : isCorrectCard
      ? NC_COLORS.softGreen
      : NC_COLORS.white;
    const borderC = isSelected
      ? '#A9CBF7'
      : isCorrectCard
      ? NC_COLORS.strokeGreen
      : NC_COLORS.border;

    return (
      <button
        key={idx}
        onClick={() => handleCardToggle(idx)}
        className="w-full rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-2 px-3 py-5 text-center transition active:scale-95"
        style={{
          backgroundColor: bg,
          borderColor: borderC,
          color: NC_COLORS.text,
          minHeight: '90px',
        }}
      >
        <div className="text-3xl leading-tight break-words">
          {round.item.emoji.repeat(Math.min(count, 9))}
        </div>
      </button>
    );
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center px-3 sm:px-4 md:px-6 pb-28 pt-6 relative"
      style={{
        backgroundColor: NC_COLORS.bg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <AnimatePresence>{status === 'correct' && <NCConfetti trigger={confettiKey} />}</AnimatePresence>

      <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl space-y-4 relative z-10">
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white/80 backdrop-blur border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center"
            style={{ color: NC_COLORS.accent }}
          >
            Number Combination
          </h1>

          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{ backgroundColor: NC_COLORS.card, color: NC_COLORS.text, border: `1px solid ${NC_COLORS.border}` }}
          >
            {stars} ⭐️
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-3xl shadow-sm p-4 md:p-5 space-y-4 relative overflow-hidden w-full flex flex-col"
          style={{ backgroundColor: NC_COLORS.card, border: `1px solid ${NC_COLORS.border}`, minHeight: '60vh' }}
        >
          <div className="text-lg font-semibold text-center px-2" style={{ color: NC_COLORS.text }}>
            {questionText}
          </div>

          {/* White panel with 2-2-1 layout */}
          <div
            className="w-full rounded-2xl border p-4 md:p-5 flex items-center justify-center"
            style={{ backgroundColor: NC_COLORS.white, borderColor: NC_COLORS.white, flex: 1 }}
          >
            <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: '420px' }}>
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {renderCard(0)}
                {renderCard(1)}
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {renderCard(2)}
                {renderCard(3)}
              </div>
              {/* Row 3 – centered single card */}
              <div className="flex justify-center w-full">
                <div style={{ width: 'calc(50% - 6px)' }}>
                  {renderCard(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={handleNext}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: NC_COLORS.softGreen,
                color: NC_COLORS.softBlack,
                borderColor: NC_COLORS.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: NC_COLORS.white,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: NC_COLORS.softGreen,
                  color: NC_COLORS.softBlack,
                  borderColor: NC_COLORS.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Try again overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: NC_COLORS.white,
                color: NC_COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: NC_COLORS.accent }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Count and Answer Game (Game 8) ---------- */

const caBuildRound = () => {
  const target = 3 + Math.floor(Math.random() * 8); // 3..10
  const numCorrect = Math.random() < 0.5 ? 2 : 3;

  const expressions = new Set();
  const options = [];

  const addExpr = (a, b, op, isCorrect) => {
    const text = `${a} ${op} ${b} =`;
    if (expressions.has(text)) return false;
    expressions.add(text);
    const value = op === '+' ? a + b : a - b;
    options.push({ text, value, isCorrect, op });
    return true;
  };

  // generate correct expressions (operands under 10)
  let tries = 0;
  while (options.filter((o) => o.isCorrect).length < numCorrect && tries < 200) {
    tries++;
    const useAdd = Math.random() < 0.65;
    if (useAdd) {
      const a = Math.floor(Math.random() * 10); // 0..9
      const b = target - a;
      if (b < 0 || b > 9) continue;
      addExpr(a, b, '+', true);
    } else {
      // a - b = target => a = target + b
      const b = Math.floor(Math.random() * 10); // 0..9
      const a = target + b;
      if (a > 9) continue; // keep operands under 10
      addExpr(a, b, '-', true);
    }
  }

  // if still not enough correct, fill with valid additions
  while (options.filter((o) => o.isCorrect).length < numCorrect) {
    for (let a = 0; a <= 9 && options.filter((o) => o.isCorrect).length < numCorrect; a++) {
      const b = target - a;
      if (b < 0 || b > 9) continue;
      addExpr(a, b, '+', true);
    }
    break;
  }

  // generate incorrect expressions (operands under 10, result not target)
  let wrongTries = 0;
  while (options.length < 6 && wrongTries < 400) {
    wrongTries++;
    const op = Math.random() < 0.6 ? '+' : '-';
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    const value = op === '+' ? a + b : a - b;
    if (value === target) continue;
    if (value < 0 || value > 18) continue; // keep results reasonable
    addExpr(a, b, op, false);
  }

  // fallback if not enough incorrect created
  while (options.length < 6) {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    const op = '+';
    const value = a + b;
    const text = `${a} ${op} ${b} =`;
    if (value === target || expressions.has(text)) continue;
    expressions.add(text);
    options.push({ text, value, isCorrect: false, op });
  }

  return { target, options: shuffle(options) };
};

function SumSubQuickGame({ onHome }) {
  const [round, setRound] = useState(caBuildRound);
  const [selection, setSelection] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [stars, setStars] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const correctIndices = useMemo(
    () => round.options.map((o, i) => (o.isCorrect ? i : null)).filter((x) => x !== null),
    [round]
  );

  const canCheck = selection.length > 0;

  const goHome = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  const toggleSelect = (idx) => {
    setSelection((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      return [...prev, idx];
    });
    if (status === 'wrong') setStatus('idle');
  };

  const setsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const x of b) if (!sa.has(x)) return false;
    return true;
  };

  const handleCheck = () => {
    if (!canCheck) return;
    const isCorrect = setsEqual(selection.slice().sort(), [...correctIndices].sort());
    if (isCorrect) {
      setStatus('correct');
      setStars((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setShowOverlay(false);
    } else {
      setStatus('wrong');
      setShowOverlay(true);
    }
  };

  const handleNext = () => {
    setRound(caBuildRound());
    setSelection([]);
    setStatus('idle');
    setShowOverlay(false);
  };

  const handleReset = () => {
    setSelection([]);
    setStatus('idle');
    setShowOverlay(false);
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center px-3 sm:px-4 md:px-6 pb-28 pt-6 relative"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <AnimatePresence>{status === 'correct' && <Confetti trigger={confettiKey} />}</AnimatePresence>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-full px-6 py-3 shadow-xl text-center"
              style={{
                backgroundColor: COLORS.white,
                color: COLORS.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-base font-bold" style={{ color: COLORS.softCoral }}>
                Try again 💪🏻
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl space-y-4 relative z-10">
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <button
            onClick={onHome}
            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white/80 backdrop-blur border border-gray-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Updated title to be static "Count and Answer" */}
          <h1
            className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-center"
            style={{ color: COLORS.accent }}
          >
            Count and Answer
          </h1>

          <div
            className="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{ backgroundColor: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            {stars} ⭐️
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-3xl shadow-sm p-4 md:p-5 space-y-4 relative overflow-hidden w-full flex flex-col"
          style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, minHeight: '60vh' }}
        >
          {/* Prompt */}
          <div className="text-lg font-semibold text-center px-2" style={{ color: COLORS.text }}>
            Choose those equals {round.target}.
          </div>

          {/* Game area */}
          <div
            className="w-full rounded-2xl border p-4 md:p-5 flex-1"
            style={{ backgroundColor: COLORS.white, borderColor: COLORS.white, flexBasis: '70%' }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
              {round.options.map((opt, idx) => {
                const isSelected = selection.includes(idx);
                const shouldHighlightCorrect = status === 'correct' && opt.isCorrect;
                const bg = isSelected ? COLORS.softBlue : shouldHighlightCorrect ? COLORS.softGreen : COLORS.white;
                const borderC = isSelected ? COLORS.softBlue : shouldHighlightCorrect ? COLORS.strokeGreen : COLORS.border;
                return (
                  <button
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className="w-full h-full rounded-2xl border shadow-sm flex items-center justify-center px-3 py-4 text-center transition active:scale-95"
                    style={{ backgroundColor: bg, borderColor: borderC, color: COLORS.text }}
                  >
                    <div className="text-lg md:text-xl font-semibold tabular-nums">{opt.text}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-4 w-full flex justify-center px-4 z-20">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'correct' ? (
            <motion.button
              key="next"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={newRound}
              className="w-full max-w-xl py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border-b-4"
              style={{
                backgroundColor: COLORS.softGreen,
                color: COLORS.softBlack,
                borderColor: COLORS.strokeGreen,
              }}
            >
              Next Question <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl flex gap-3"
            >
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softCoral,
                  color: COLORS.card,
                  borderColor: COLORS.softCoral,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className="flex-1 py-4 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95 border-b-4 disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.softGreen,
                  color: COLORS.softBlack,
                  borderColor: COLORS.strokeGreen,
                }}
              >
                Check Answer <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


/* ---------- App Shell ---------- */

const gameList = [
  { id: 'react2', title: 'Arrow Path', desc: 'Arrow Path Grid', component: ArrowPathGrid },
  { id: 'react3', title: 'Number Decomposition', desc: 'Number Decomposition', component: DecompositionGame },
  { id: 'react4', title: 'Shape Finder', desc: 'Find the shapes', component: ShapeFinderGame },
  { id: 'pattern', title: 'Complete the Pattern', desc: 'Emoji patterns', component: EmojiPatternGame },
  { id: 'food', title: 'Count the Food', desc: 'Count foods and choose totals', component: CountThreeFoodsGame },
  { id: 'ng', title: 'Number Groups', desc: 'Group and count', component: NumberGroupsGame },
  { id: 'number-combination', title: 'Number Combination', desc: 'Find two groups that add to the target', component: NumberCombinationGame },
  { id: 'count-answer', title: 'Count and Answer', desc: 'Pick the correct sums/differences', component: SumSubQuickGame },
];

function GamesHub() {
  const [screen, setScreen] = useState('home'); // home | game
  const [selected, setSelected] = useState(null);

  const SelectedComponent = useMemo(() => {
    if (!selected) return null;
    return selected.component;
  }, [selected]);

  return (
    <div className="min-h-screen w-full">
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: 'transparent' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-8 md:p-10 shadow-xl text-center w-full max-w-4xl border-4"
              style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}
            >
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="text-6xl md:text-7xl">🧪</div>
                <h1 className="text-3xl md:text-4xl font-black" style={{ color: COLORS.softBlack }}>
                  Math Lab
                </h1>
              </div>

              {/* Updated grid and font sizing */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                {gameList.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelected(g);
                      setScreen('game');
                    }}
                    className="w-full text-base sm:text-lg md:text-xl font-black py-3 md:py-4 rounded-2xl shadow-md transition-transform active:scale-95"
                    style={{
                      backgroundColor: COLORS.softBlue,
                      color: COLORS.softBlack,
                      borderColor: COLORS.strokeBlue,
                      borderWidth: 1,
                      borderStyle: 'solid',
                    }}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {screen === 'game' && selected && SelectedComponent && (
          <motion.div key="game" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="bg-transparent">
            <SelectedComponent
              onHome={() => {
                setScreen('home');
                setSelected(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GamesHub;
