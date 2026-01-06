import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle2, XCircle, Timer, Trophy, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MathLab() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'result'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentProblem, setCurrentProblem] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Function to start the game
  const startGame = () => {
    console.log("Start button clicked!"); // This will show in your console
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    generateProblem();
  };

  const generateProblem = useCallback(() => {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
    }

    const wrongOptions = new Set();
    while (wrongOptions.size < 3) {
      const wrong = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      if (wrong !== answer && wrong >= 0) wrongOptions.add(wrong);
    }

    const allOptions = [...Array.from(wrongOptions), answer].sort(() => Math.random() - 0.5);
    
    setCurrentProblem({ a, b, op, answer });
    setOptions(allOptions);
    setFeedback(null);
  }, []);

  const handleAnswer = (selected) => {
    if (selected === currentProblem.answer) {
      setScore(s => s + 10);
      setFeedback('correct');
      setTimeout(generateProblem, 500);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('result');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl text-center border-b-4 border-blue-200"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Math Lab</h1>
              <p className="text-slate-500 mb-8">Test your speed and accuracy!</p>
              <button
                onClick={startGame}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xl transition-all shadow-lg active:transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play fill="currentColor" /> START GAME
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-indigo-200"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                  <Timer className="w-5 h-5 text-amber-600" />
                  <span className="font-mono font-bold text-amber-700 text-xl">{timeLeft}s</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                  <Star className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700 text-xl">{score}</span>
                </div>
              </div>

              <div className="text-center mb-10">
                <div className="text-6xl font-black text-slate-800 tracking-tighter">
                  {currentProblem.a} {currentProblem.op === '*' ? '×' : currentProblem.op} {currentProblem.b}
                </div>
                <div className="text-2xl font-bold text-slate-300 mt-2">= ?</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className={`py-6 rounded-2xl text-2xl font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                      feedback === 'correct' && opt === currentProblem.answer 
                        ? 'bg-emerald-500 border-emerald-700 text-white'
                        : feedback === 'wrong' && opt !== currentProblem.answer
                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 shadow-xl text-center border-b-4 border-purple-200"
            >
              <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">Time's Up!</h2>
              <div className="my-6">
                <div className="text-5xl font-black text-blue-600">{score}</div>
                <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">Total Points</div>
              </div>
              <button
                onClick={startGame}
                className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> TRY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
