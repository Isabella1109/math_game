import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, ArrowRight, Star, Home, XCircle, Trophy } from 'lucide-react';

// --- STRICT COLOR PALETTE ---
const COLORS = {
  softBlue: '#D7E2E8',   // Buttons, accents
  paleYellow: '#FFB74D', // Highlights, correct answer glow
  softCoral: '#FF8B8B',  // Incorrect feedback, reset button
  softGreen: '#A8D8B9',  // OK/Answer buttons, success states
  white: '#FFFFFF',
  lightGray: '#F9FAFB',  // Neutral background
  softBlack: '#374151',  // Text
  mutedGray: '#9CA3AF'   // Secondary text
};

const PRAISES = [
  "You're smart!", "Amazing job!", "Math Star!", "Way to go!",
  "You're a genius!", "Perfect!", "Keep it up!", "Wow! Great work!"
];

const ADDITION_POOL = [
  { n1: 2, n2: 3, target: 5 }, { n1: 4, n2: 2, target: 6 },
  { n1: 5, n2: 1, target: 6 }, { n1: 3, n2: 3, target: 6 },
  { n1: 1, n2: 4, target: 5 }, { n1: 6, n2: 2, target: 8 },
  { n1: 2, n2: 5, target: 7 }, { n1: 4, n2: 4, target: 8 },
  { n1: 7, n2: 2, target: 9 }, { n1: 3, n2: 5, target: 8 }
];

const SUBTRACTION_POOL = [
  { n1: 5, n2: 2, target: 3 }, { n1: 6, n2: 3, target: 3 },
  { n1: 8, n2: 4, target: 4 }, { n1: 7, n2: 2, target: 5 },
  { n1: 9, n2: 5, target: 4 }, { n1: 4, n2: 1, target: 3 },
  { n1: 10, n2: 6, target: 4 }, { n1: 8, n2: 3, target: 5 },
  { n1: 6, n2: 4, target: 2 }, { n1: 5, n2: 4, target: 1 }
];

const EMOJIS = ['🍎', '🐱', '🐸', '🍓', '🐻', '🐥', '🍭', '🐶'];

// --- CONFETTI COMPONENT ---
const ConfettiBurst = () => {
  const particleCount = 80;
  const palette = [COLORS.softBlue, COLORS.paleYellow, COLORS.softCoral, COLORS.softGreen];
  
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const velocity = 15 + Math.random() * 20; 
    const shapeType = Math.floor(Math.random() * 3); 
    
    return {
      id: i,
      x: Math.cos(angle) * velocity * 12,
      y: Math.sin(angle) * velocity * 12,
      rotation: Math.random() * 720,
      scale: 0.6 + Math.random() * 0.8,
      color: palette[i % palette.length],
      shapeType,
      delay: Math.random() * 0.05
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ 
            x: [0, p.x, p.x * 1.1],
            y: [0, p.y, p.y + 600],
            scale: [0, p.scale, p.scale, 0],
            rotate: [0, p.rotation],
            opacity: [1, 1, 1, 0]
          }}
          transition={{ 
            duration: 2.8, 
            ease: [0.1, 0.9, 0.3, 1],
            delay: p.delay 
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

// --- MAIN COMPONENT ---
export default function MathLab() {
  const [gameState, setGameState] = useState('menu'); 
  const [currentSet, setCurrentSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAddedCount, setUserAddedCount] = useState(0);
  const [removedIndices, setRemovedIndices] = useState([]);
  const [status, setStatus] = useState('counting'); 
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [emoji, setEmoji] = useState('🍎');
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [hasFailedThisQuestion, setHasFailedThisQuestion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const audioCtxRef = useRef(null);

  // Initialize Audio Context (Important for iOS)
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    // Resume immediately if suspended (common in iOS)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playDingDing = useCallback(() => {
    try {
      // Ensure initialized
      if (!audioCtxRef.current) initAudio();
      
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const playTone = (freq, time, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      };
      playTone(880, now, 0.1);         
      playTone(1174, now + 0.08, 0.15); 
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, [initAudio]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Small delay helps iOS handle the speech queue better
      setTimeout(() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.2;
        utterance.rate = 0.9; 
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };

  const startNewGame = () => {
    // 1. Initialize audio on user interaction (Fix for iOS silence)
    initAudio();

    setCurrentIndex(0);
    setFirstTryCount(0);
    setUserAddedCount(0);
    setRemovedIndices([]);
    setStatus('counting');
    setSelectedChoice(null);
    setHasFailedThisQuestion(false);
    setShowConfetti(false);

    const pattern = ['add', 'add', 'sub', 'sub', 'add', 'add', 'sub', 'sub', 'add', 'sub'];
    const shuffledAdd = [...ADDITION_POOL].sort(() => Math.random() - 0.5);
    const shuffledSub = [...SUBTRACTION_POOL].sort(() => Math.random() - 0.5);
    
    let aI = 0, sI = 0;
    
    const newSet = pattern.map(type => {
      const base = type === 'add' ? shuffledAdd[aI++] : shuffledSub[sI++];
      
      // --- FIX: INFINITE LOOP PREVENTION ---
      // Instead of a while loop that might never finish if the target is small (e.g., 1),
      // we generate a pool of all possible numbers (1-10), remove the correct answer,
      // shuffle them, and pick 3.
      const allPossibleNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const wrongAnswers = allPossibleNumbers
        .filter(n => n !== base.target)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const finalChoices = [...wrongAnswers, base.target].sort((a, b) => a - b);

      return { ...base, type, choices: finalChoices };
    });
    
    setCurrentSet(newSet);
    setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    setGameState('playing');
  };

  const handleCheck = () => {
    const q = currentSet[currentIndex];
    if (!q) return;
    const isCorrect = q.type === 'add' ? userAddedCount === q.n2 : removedIndices.length === q.n2;
    if (isCorrect) {
      setStatus('choosing');
    } else { 
      setStatus('wrong'); 
      setHasFailedThisQuestion(true); 
    }
  };

  const handleChoice = (val) => {
    const q = currentSet[currentIndex];
    if (!q) return;
    setSelectedChoice(val);
    if (val === q.target) {
      setStatus('solved');
      setShowConfetti(true);
      playDingDing(); 
      speakText(PRAISES[Math.floor(Math.random() * PRAISES.length)]); 
      if (!hasFailedThisQuestion) setFirstTryCount(prev => prev + 1);
    } else {
      setHasFailedThisQuestion(true);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
      setUserAddedCount(0);
      setRemovedIndices([]);
      setStatus('counting');
      setSelectedChoice(null);
      setHasFailedThisQuestion(false);
      setShowConfetti(false);
      setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    } else {
      setGameState('results');
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="rounded-3xl p-10 shadow-xl text-center max-w-sm w-full border-4" 
          style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}>
          <div className="text-7xl mb-4">🧪</div>
          <h1 className="text-4xl font-black mb-2" style={{ color: COLORS.softBlack }}>Math Lab</h1>
          <p className="font-bold mb-8" style={{ color: COLORS.mutedGray }}>Let's experiment with numbers!</p>
          <button 
            onClick={startNewGame} 
            className="w-full text-2xl font-black py-4 rounded-2xl shadow-md transition-transform active:scale-95"
            style={{ backgroundColor: COLORS.softBlue, color: COLORS.softBlack }}
          >
            Start
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-10 shadow-2xl text-center max-w-sm w-full border-4" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softGreen }}>
          <Trophy size={80} className="mx-auto mb-4" style={{ color: COLORS.paleYellow }} />
          <h2 className="text-3xl font-black" style={{ color: COLORS.softBlack }}>Lab Report</h2>
          <div className="my-8 rounded-2xl p-6 bg-white border-2" style={{ borderColor: COLORS.softBlue }}>
            <p className="font-black text-xs uppercase tracking-widest mb-1" style={{ color: COLORS.mutedGray }}>Perfect Experiments</p>
            <div className="text-6xl font-black" style={{ color: COLORS.softBlack }}>{firstTryCount}<span className="text-2xl" style={{ color: COLORS.mutedGray }}>/10</span></div>
          </div>
          <button 
            onClick={() => setGameState('menu')} 
            className="w-full text-xl font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
            style={{ backgroundColor: COLORS.softBlue, color: COLORS.softBlack }}
          >
            <Home size={20} /> Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  const q = currentSet[currentIndex];
  if (!q) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans bg-white relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <div className="px-4 py-2 rounded-2xl font-black shadow-sm border-2" style={{ backgroundColor: COLORS.lightGray, color: COLORS.softBlack, borderColor: COLORS.softBlue }}>
          Question {currentIndex + 1} / 10
        </div>
        <div className="px-4 py-2 rounded-2xl font-black text-white flex items-center gap-2 shadow-sm" style={{ backgroundColor: COLORS.paleYellow }}>
          <Star size={18} fill="white" /> {firstTryCount}
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl flex-1 rounded-3xl shadow-sm p-6 flex flex-col border-b-8 min-h-[500px] relative" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}>
        <div className="text-center mb-6 flex items-center justify-center gap-4">
          <h2 className="text-5xl font-black" style={{ color: COLORS.softBlack }}>
            {q.n1} {q.type === 'add' ? '+' : '-'} {q.n2} = <span style={{ color: COLORS.paleYellow }}>{status === 'solved' ? q.target : '?'}</span>
          </h2>
        </div>

        {/* Work Area */}
        <div className="flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 relative min-h-[240px] bg-white" style={{ borderColor: COLORS.softBlue }}>
          {q.type === 'add' ? (
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex gap-3">
                {Array.from({ length: q.n1 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-4xl">{emoji}</span>
                    <span className="text-xs font-bold mt-1" style={{ color: COLORS.mutedGray }}>{i + 1}</span>
                  </div>
                ))}
              </div>
              <Plus style={{ color: COLORS.mutedGray }} strokeWidth={3} />
              <div className="min-w-[120px] min-h-[80px] p-3 rounded-2xl border-2 flex flex-wrap gap-3 items-center justify-center relative" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}>
                {Array.from({ length: userAddedCount }).map((_, i) => (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="flex flex-col items-center">
                    <span className="text-4xl">{emoji}</span>
                    <span className="text-xs font-bold mt-1" style={{ color: COLORS.softBlack }}>{q.n1 + i + 1}</span>
                  </motion.div>
                ))}
                {(status === 'counting' || status === 'wrong') && (
                  <button 
                    onClick={() => setUserAddedCount(prev => Math.min(prev + 1, 9))} 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform active:scale-90"
                    style={{ backgroundColor: COLORS.softBlue, color: COLORS.softBlack }}
                  >
                    <Plus size={20} strokeWidth={4} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 max-w-sm">
              {Array.from({ length: q.n1 }).map((_, i) => {
                const isRemoved = removedIndices.includes(i);
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (status === 'counting' || status === 'wrong') {
                        setRemovedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                      }
                    }}
                    className="relative flex flex-col items-center transition-all"
                  >
                    <span className={`text-5xl transition-all duration-300 ${isRemoved ? 'opacity-20 grayscale scale-90' : 'opacity-100'}`}>{emoji}</span>
                    {isRemoved && (
                      <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 45 }} className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-1.5 rounded-full absolute" style={{ backgroundColor: COLORS.softCoral }} />
                        <div className="w-12 h-1.5 rounded-full absolute rotate-90" style={{ backgroundColor: COLORS.softCoral }} />
                      </motion.div>
                    )}
                    <span className="text-xs font-bold mt-1" style={{ color: isRemoved ? COLORS.mutedGray : COLORS.softBlack }}>{i + 1}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="absolute bottom-4 h-6">
            <AnimatePresence>
              {status === 'wrong' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-black flex items-center gap-2" style={{ color: COLORS.softCoral }}>
                  <XCircle size={18}/> Try again!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interaction Area */}
        <div className="h-32 flex flex-col items-center justify-center mt-6">
          {(status === 'counting' || status === 'wrong') ? (
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {setUserAddedCount(0); setRemovedIndices([]); setStatus('counting');}} 
                className="flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: COLORS.softCoral, color: COLORS.white }}
              >
                <RotateCcw size={20} /> Reset
              </button>
              <button 
                onClick={handleCheck} 
                className="flex-1 py-4 rounded-2xl font-black shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: COLORS.softGreen, color: COLORS.softBlack }}
              >
                Check Answer
              </button>
            </div>
          ) : (status === 'choosing' || status === 'solved') ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex gap-3">
                {q.choices.map(choice => (
                  <button
                    key={choice}
                    disabled={status === 'solved'}
                    onClick={() => handleChoice(choice)}
                    className="w-16 h-16 rounded-2xl text-2xl font-black transition-all shadow-md flex items-center justify-center border-4"
                    style={{ 
                      backgroundColor: selectedChoice === choice 
                        ? (choice === q.target ? COLORS.softGreen : COLORS.softCoral)
                        : COLORS.white,
                      color: selectedChoice === choice && choice !== q.target ? COLORS.white : COLORS.softBlack,
                      borderColor: (status === 'solved' && choice === q.target) ? COLORS.paleYellow : 'transparent'
                    }}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {status === 'solved' && (
                <motion.button
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  onClick={nextQuestion}
                  className="mt-4 w-full py-4 rounded-2xl text-xl font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                  style={{ backgroundColor: COLORS.softGreen, color: COLORS.softBlack }}
                >
                  {currentIndex === 9 ? 'Results' : 'Next Question'} <ArrowRight />
                </motion.button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xl mt-6 mb-8">
        <div className="h-4 rounded-full overflow-hidden flex p-1 shadow-inner" style={{ backgroundColor: COLORS.lightGray }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 mx-0.5 rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: i < currentIndex ? COLORS.softGreen : i === currentIndex ? COLORS.softBlue : COLORS.mutedGray 
              }}
            />
          ))}
        </div>
      </div>

      {/* CONFETTI OVERLAY (Z-9999) */}
      <AnimatePresence>
        {showConfetti && <ConfettiBurst key="global-styled-confetti" />}
      </AnimatePresence>
    </div>
  );
}
