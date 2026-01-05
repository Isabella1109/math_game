import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Star, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MathGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', answer: 0, options: [] });
  const [feedback, setFeedback] = useState(null);
  const [timer, setTimer] = useState(10);
  const [highScore, setHighScore] = useState(0);

  // --- DING DING SOUND EFFECT ---
  const playDingDing = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
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
      // Two-tone "Ding Ding"
      playTone(880, now, 0.15);         // First "Ding" (A5)
      playTone(1174.66, now + 0.1, 0.2); // Second "Ding" (D6)
    } catch (e) {
      console.error("Audio context error:", e);
    }
  };

  const generateQuestion = useCallback(() => {
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    }

    const options = new Set([answer]);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 5) + 1;
      options.add(Math.random() > 0.5 ? answer + offset : Math.max(0, answer - offset));
    }

    setQuestion({
      a, b, op, answer,
      options: Array.from(options).sort((x, y) => x - y)
    });
    setTimer(10);
    setFeedback(null);
  }, []);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
    generateQuestion();
  };

  const handleAnswer = (choice) => {
    if (feedback) return;

    if (choice === question.answer) {
      setFeedback('correct');
      setScore(s => s + 1);
      playDingDing(); // <--- Sound triggered here
      setTimeout(() => {
        generateQuestion();
      }, 600);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setGameState('gameOver');
        if (score > highScore) setHighScore(score);
      }, 800);
    }
  };

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && !feedback) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setGameState('gameOver');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, feedback]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Score</p>
            <p className="text-3xl font-black">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs uppercase tracking-wider font-bold">Best</p>
            <p className="text-xl font-bold">{highScore}</p>
          </div>
        </div>

        <div className="p-8">
          {gameState === 'menu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
              <div className="bg-indigo-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-indigo-600 fill-indigo-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-800">Math Dash</h1>
              <p className="text-slate-500">Solve as many as you can!</p>
              <button 
                onClick={startGame}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-xl"
              >
                Start Playing
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timer / 10) * 100}%` }}
                  className={`h-full ${timer < 4 ? 'bg-red-500' : 'bg-emerald-500'}`}
                />
              </div>

              <div className="text-center py-4">
                <motion.div 
                  key={question.a + question.b}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black text-slate-800 flex items-center justify-center gap-4"
                >
                  <span>{question.a}</span>
                  <span className="text-indigo-500">{question.op}</span>
                  <span>{question.b}</span>
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {question.options.map((opt) => (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!feedback}
                    className={`
                      py-6 rounded-2xl text-2xl font-bold border-b-4 transition-colors
                      ${feedback === 'correct' && opt === question.answer ? 'bg-emerald-500 border-emerald-700 text-white' : 
                        feedback === 'wrong' && opt !== question.answer ? 'bg-slate-100 border-slate-200 text-slate-400' :
                        feedback === 'wrong' && opt === question.answer ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                        'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100'}
                    `}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    {feedback === 'correct' ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-6 h-6" /> Correct!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 font-bold">
                        <XCircle className="w-6 h-6" /> Game Over
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {gameState === 'gameOver' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
              <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Final Score: {score}</h2>
                <p className="text-slate-500">Great effort!</p>
              </div>
              
              <button 
                onClick={startGame}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xl"
              >
                <RefreshCw className="w-6 h-6" /> Play Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathGame;
