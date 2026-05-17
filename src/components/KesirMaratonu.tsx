import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  Zap, 
  Scale, 
  Layout, 
  Timer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

type Representation = 'NUMERIC' | 'CIRCLE' | 'BAR' | 'MIXED';

interface Fraction {
  num: number;
  den: number;
  mixed?: number;
  type: Representation;
  value: number;
}

export default function KesirMaratonu() {
  const { user, userProfile } = useAuth();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'FEEDBACK' | 'END'>('START');
  const [pair, setPair] = useState<[Fraction, Fraction] | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const generateFraction = (difficulty: number): Fraction => {
    const types: Representation[] = ['NUMERIC', 'CIRCLE', 'BAR'];
    if (difficulty > 3) types.push('MIXED');
    
    const type = types[Math.floor(Math.random() * types.length)];
    let num, den, mixed = 0;

    if (type === 'MIXED') {
      mixed = Math.floor(Math.random() * 2) + 1;
      den = [2, 3, 4, 5, 10][Math.floor(Math.random() * 5)];
      num = Math.floor(Math.random() * (den - 1)) + 1;
    } else {
      den = [2, 3, 4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 8)];
      num = Math.floor(Math.random() * (den)) + 1;
    }

    const value = mixed + (num / den);
    return { num, den, mixed, type, value };
  };

  const nextRound = useCallback(() => {
    const f1 = generateFraction(level);
    let f2 = generateFraction(level);
    
    // Ensure they aren't exactly the same for better gameplay
    while (Math.abs(f1.value - f2.value) < 0.001) {
      f2 = generateFraction(level);
    }

    setPair([f1, f2]);
    setTimeLeft(3);
    setGameState('PLAYING');
    setFeedback(null);
  }, [level]);

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      handleAnswer(null); // Time out
    }
  }, [timeLeft, gameState]);

  const handleAnswer = async (selectedIdx: number | null) => {
    if (!pair) return;
    
    const isCorrect = selectedIdx !== null && (
      (selectedIdx === 0 && pair[0].value > pair[1].value) ||
      (selectedIdx === 1 && pair[1].value > pair[0].value)
    );

    if (isCorrect) {
      const points = 10 + timeLeft;
      setScore(s => s + points);
      setFeedback({ isCorrect: true, message: `Harika! +${points} Puan` });
      if (score > 0 && score % 50 === 0) setLevel(l => l + 1);
    } else {
      setFeedback({ 
        isCorrect: false, 
        message: selectedIdx === null ? "Süre Doldu!" : "Yanlış Karşılaştırma!" 
      });
      // End game after 3 mistakes? Or just keep going? Let's do a life system or simplified "end game"
      if (level > 5) setGameState('END');
    }

    setGameState('FEEDBACK');
    await saveProgress(isCorrect);
  };

  const saveProgress = async (isCorrect: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/gameProgress/kesir-maratonu`;
    const progressRef = doc(db, path);
    try {
      await setDoc(progressRef, {
        gameId: 'Kesir Maratonu',
        userId: user.uid,
        bestScore: score,
        levelReached: level,
        lastPlayed: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    nextRound();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col gap-6 h-full">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl border-4 border-slate-800 overflow-hidden flex flex-col h-[750px] relative">
        {/* Neon HUD */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/50">
              <Scale className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider italic">Kesir Maratonu</h1>
              <div className="flex gap-2 mt-1">
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">LEVEL {level}</span>
                <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">MAT.5.1.4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Süre</span>
                <div className={`text-2xl font-black tabular-nums ${timeLeft <= 1 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                  {timeLeft}s
                </div>
             </div>
             <div className="bg-slate-800 h-10 w-[1px]" />
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skor</span>
                <div className="text-2xl font-black text-cyan-400 tabular-nums">
                  {score.toString().padStart(4, '0')}
                </div>
             </div>
          </div>
        </div>

        {/* Track Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]">
          {/* Animated Background Lines */}
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full transform -skew-x-12 flex justify-around">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="w-[1px] h-full bg-cyan-500/30" />
               ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {gameState === 'START' && (
              <motion.div 
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center z-10"
              >
                <div className="w-32 h-32 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-cyan-500/50 animate-pulse">
                  <Zap className="w-16 h-16 text-cyan-400" />
                </div>
                <h2 className="text-4xl font-black text-white italic uppercase mb-4">Hangi Kesir Daha Büyük?</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10">
                  Farklı modellerle gösterilen kesirleri karşılaştır, en hızlı kararı ver, yarışı kazan!
                </p>
                <button 
                  onClick={startGame}
                  className="bg-cyan-500 text-slate-900 px-12 py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                >
                  YARIŞI BAŞLAT
                </button>
              </motion.div>
            )}

            {gameState === 'PLAYING' && pair && (
              <motion.div 
                key="round"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="w-full h-full flex flex-col items-center justify-between"
              >
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm mb-8">BÜYÜK OLANI SEÇ!</div>
                
                <div className="flex-1 w-full flex items-center justify-center gap-12 md:gap-24">
                  <FractionCard fraction={pair[0]} onClick={() => handleAnswer(0)} side="left" />
                  <div className="text-4xl font-black text-slate-700 italic">VS</div>
                  <FractionCard fraction={pair[1]} onClick={() => handleAnswer(1)} side="right" />
                </div>
              </motion.div>
            )}

            {gameState === 'FEEDBACK' && feedback && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="text-center z-20"
              >
                <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto mb-6 ${feedback.isCorrect ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]'}`}>
                  {feedback.isCorrect ? <CheckCircle2 className="w-16 h-16 text-white" /> : <AlertCircle className="w-16 h-16 text-white" />}
                </div>
                <h3 className={`text-4xl font-black uppercase italic mb-8 ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {feedback.message}
                </h3>
                <button 
                  onClick={nextRound}
                  className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm border border-white/20 transition-all flex items-center gap-3 mx-auto"
                >
                  Devam Et <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 text-slate-500">
            <Timer className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Zamana Karşı Yarış</span>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_cyan]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hızlı Yanıt Bonus Puan</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FractionCard({ fraction, onClick, side }: { fraction: Fraction, onClick: () => void, side: 'left' | 'right' }) {
  return (
    <motion.button
      whileHover={{ y: -10, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group relative w-56 h-72 rounded-[40px] p-6 flex flex-col items-center justify-between transition-all overflow-hidden bg-slate-800/50 border-2 border-slate-700 hover:border-cyan-500/50 shadow-xl`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative h-32 w-full flex items-center justify-center">
        {fraction.type === 'NUMERIC' && (
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-white leading-none">{fraction.num}</span>
            <div className="w-16 h-1.5 bg-cyan-500 my-2 rounded-full shadow-[0_0_10px_cyan]" />
            <span className="text-5xl font-black text-white leading-none">{fraction.den}</span>
          </div>
        )}

        {fraction.type === 'BAR' && (
          <div className="w-full px-4">
            <div className="w-full h-12 bg-slate-700 rounded-lg overflow-hidden border border-slate-600 flex">
              {[...Array(fraction.den)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 border-r border-slate-900/30 ${i < fraction.num ? 'bg-cyan-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' : 'bg-transparent'}`} 
                />
              ))}
            </div>
            <div className="mt-2 text-center text-[10px] font-black text-slate-500 tracking-widest">{fraction.den} PARÇA</div>
          </div>
        )}

        {fraction.type === 'CIRCLE' && (
          <div className="relative w-24 h-24">
             <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="45" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <path 
                  d={describeArc(50, 50, 45, 0, (fraction.num / fraction.den) * 360)} 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_5px_cyan]"
                />
                {/* Reference lines */}
                {[...Array(fraction.den)].map((_, i) => {
                  const angle = (i * 360) / fraction.den;
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <line 
                      key={i}
                      x1={50 + 35 * Math.cos(rad)} y1={50 + 35 * Math.sin(rad)}
                      x2={50 + 45 * Math.cos(rad)} y2={50 + 45 * Math.sin(rad)}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                  );
                })}
             </svg>
          </div>
        )}

        {fraction.type === 'MIXED' && (
          <div className="flex items-center gap-3">
             <span className="text-6xl font-black text-cyan-400 italic drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">{fraction.mixed}</span>
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-white leading-none">{fraction.num}</span>
                <div className="w-10 h-1 bg-white/30 my-1 rounded-full" />
                <span className="text-3xl font-black text-white leading-none">{fraction.den}</span>
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-600">
        <span className="text-[10px] font-black text-cyan-500 tracking-tighter uppercase">
          {fraction.type === 'MIXED' ? 'Tam Sayılı' : fraction.type === 'CIRCLE' ? 'Dairesel' : fraction.type === 'BAR' ? 'Modellenmiş' : 'Sayısal'}
        </span>
      </div>
    </motion.button>
  );
}

// SVG Arc helper
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  if (endAngle === 360) endAngle = 359.99;
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
