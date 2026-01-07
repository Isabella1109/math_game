import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, ArrowRight, Star, Home, XCircle, Trophy } from 'lucide-react';

// --- CONSTANTS (Exact React 23 Palette) ---
const COLORS = {
  softBlue: '#D7E2E8',
  paleYellow: '#FFB74D',
  softCoral: '#FF8B8B',
  softGreen: '#A8D8B9',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  softBlack: '#333333',
  mutedGray: '#AAAAAA'
};

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

// --- COMPONENTS ---
const ConfettiPiece = ({ index }) => {
  const confettiColors = [COLORS.softBlue, COLORS.paleYellow, COLORS.softGreen, COLORS.softCoral];
  const color = confettiColors[index % confettiColors.length];
  const shapeType = index % 3; // 0: Circle, 1: Square, 2: Triangle

  return (
    <motion.div
      initial={{ top: -20, left: `${Math.random() * 100}%`, rotate: 0 }}
      animate={{ 
        top: '110%', 
        rotate: 360,
        left: `${(Math.random() * 100) + (Math.random() * 20 - 10)}%` 
      }}
      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
      className="absolute z-50 pointer-events-none"
      style={{ 
        backgroundColor: color,
        width: '12px',
        height: '12px',
        clipPath: shapeType === 2 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
        borderRadius: shapeType === 0 ? '50%' : shapeType === 1 ? '2px' : '0'
      }}
    />
  );
};

export default function MathLab() {
  const [gameState, setGameState] = useState('menu'); 
  const [currentSet, setCurrentSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAddedCount, setUserAddedCount] = useState(0);
  const [removedIndices, setRemovedIndices] = useState([]);
  const [status, setStatus] = useState('counting'); // counting, wrong, choosing, solved
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [emoji, setEmoji] = useState('🍎');
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [hasFailedThisQuestion, setHasFailedThisQuestion] = useState(false);

  // --- SOUND EFFECT LOGIC ---
  const playDingDing = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      
      const playTone = (freq, startTime, duration) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(880, now, 0.15);         
      playTone(1174.66, now + 0.1, 0.2); 
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  const generateSet = () => {
    const pattern = ['add', 'add', 'sub', 'sub', 'add', 'add', 'sub', 'sub', 'add', 'sub'];
    const shuffledAdd = [...ADDITION_POOL].sort(() => Math.random() - 0.5);
    const shuffledSub = [...SUBTRACTION_POOL].sort(() => Math.random() - 0.5);
    let addIdx = 0, subIdx = 0;
    
    const newSet = pattern.map(type => {
      const base = type === 'add' ? shuffledAdd[addIdx++] : shuffledSub[subIdx++];
      const choices = new Set([base.target]);
      while(choices.size < 4) {
        const fake = Math.max(1, Math.min(10, base.target + (Math.floor(Math.random() * 5) - 2)));
        choices.add(fake);
      }
      return { ...base, type, choices: Array.from(choices).sort((a, b) => a - b) };
    });
    
    setCurrentSet(newSet);
    setCurrentIndex(0);
    setFirstTryCount(0);
    loadQuestion(newSet[0]);
  };

  const loadQuestion = (q) => {
    if (!q) return;
    setUserAddedCount(0);
    setRemovedIndices([]);
    setStatus('counting');
    setSelectedChoice(null);
    setHasFailedThisQuestion(false);
    setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  };

  const handleCheck = () => {
    const q = currentSet[currentIndex];
    if (!q) return;
    const isCorrect = q.type === 'add' ? userAddedCount === q.n2 : removedIndices.length === q.n2;
    if (isCorrect) setStatus('choosing');
    else { setStatus('wrong'); setHasFailedThisQuestion(true); }
  };

  const handleChoice = (val) => {
    const q = currentSet[currentIndex];
    if (!q) return;
    setSelectedChoice(val);
    if (val === q.target) {
      playDingDing(); 
      if (!hasFailedThisQuestion) setFirstTryCount(prev => prev + 1);
      setStatus('solved');
    } else {
      setHasFailedThisQuestion(true);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < 9) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadQuestion(currentSet[nextIdx]);
    } else setGameState('results');
  };

  // --- VIEWS ---
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: COLORS.white }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
          className="rounded-3xl p-10 shadow-xl text-center max-w-sm w-full border-2" 
          style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}>
          <div className="text-7xl mb-4">🧪</div>
          <h1 className="text-4xl font-black mb-2" style={{ color: COLORS.softBlack }}>Math Lab</h1>
          <p className="font-bold mb-8" style={{ color: COLORS.mutedGray }}>Let's experiment with numbers!</p>
          <button 
            onClick={() => { generateSet(); setGameState('playing'); }} 
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
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: COLORS.white }}>
        {Array.from({ length: 50 }).map((_, i) => <ConfettiPiece key={i} index={i} />)}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-10 shadow-2xl text-center max-w-sm w-full z-10 border-2" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softGreen }}>
          <Trophy size={80} className="mx-auto mb-4" style={{ color: COLORS.paleYellow }} />
          <h2 className="text-3xl font-black" style={{ color: COLORS.softBlack }}>Lab Report</h2>
          <div className="my-8 rounded-2xl p-6" style={{ backgroundColor: COLORS.white }}>
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
    <div className="min-h-screen flex flex-col items-center p-4 font-sans overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <div className="px-4 py-2 rounded-2xl font-black shadow-sm" style={{ backgroundColor: COLORS.lightGray, color: COLORS.mutedGray }}>
          Question {currentIndex + 1} / 10
        </div>
        <div className="px-4 py-2 rounded-2xl font-black text-white flex items-center gap-2 shadow-sm" style={{ backgroundColor: COLORS.paleYellow }}>
          <Star size={18} fill="white" /> {firstTryCount}
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl flex-1 rounded-3xl shadow-sm p-6 flex flex-col border-b-8 min-h-[500px]" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.softBlue }}>
        <div className="text-center mb-6">
          <h2 className="text-5xl font-black" style={{ color: COLORS.softBlack }}>
            {q.n1} {q.type === 'add' ? '+' : '-'} {q.n2} = <span style={{ color: COLORS.paleYellow }}>{status === 'solved' ? q.target : '?'}</span>
          </h2>
        </div>

        {/* Work Area */}
        <div className="flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 relative min-h-[240px]" style={{ backgroundColor: COLORS.white, borderColor: COLORS.softBlue }}>
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
                    onClick={() => (status === 'counting' || status === 'wrong') && setRemovedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
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
                  {currentIndex === 9 ? 'Results' : 'OK'} <ArrowRight />
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
    </div>
  );
}
