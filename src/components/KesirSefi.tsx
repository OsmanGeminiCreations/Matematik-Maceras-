import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, CheckCircle2, RotateCcw, Star, ChefHat, Users, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

type GameState = 'ORDER' | 'SLICING' | 'RESULT';

export default function KesirSefi() {
  const { user, userProfile } = useAuth();
  const [gameState, setGameState] = useState<GameState>('ORDER');
  const [targetNumerator, setTargetNumerator] = useState(0);
  const [targetDenominator, setTargetDenominator] = useState(1);
  const [currentSlices, setCurrentSlices] = useState(1);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const generateOrder = () => {
    const denoms = [2, 3, 4, 6, 8, 12];
    const denom = denoms[Math.floor(Math.random() * denoms.length)];
    const num = Math.floor(Math.random() * (denom - 1)) + 1;
    setTargetNumerator(num);
    setTargetDenominator(denom);
    setCurrentSlices(1);
    setSelectedIndices([]);
    setGameState('SLICING');
  };

  const handleSlice = () => {
    if (currentSlices < 12) {
      setCurrentSlices(prev => prev + 1);
      setSelectedIndices([]);
    }
  };

  const toggleSlice = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const serveOrder = async () => {
    const selectedCount = selectedIndices.length;
    const userValue = selectedCount / currentSlices;
    const targetValue = targetNumerator / targetDenominator;

    // Use a small epsilon for floating point comparison
    if (Math.abs(userValue - targetValue) < 0.001) {
      const points = 15;
      setScore(prev => prev + points);
      setFeedback('Mükemmel! Tam istediğim oranda bir pizza.');
      await updateFirebaseProgress(points, true);
    } else {
      setScore(0);
      setFeedback(`Maalesef yanlış. Ben ${targetNumerator}/${targetDenominator} istemiştim, sen ${selectedCount}/${currentSlices} verdin.`);
      await updateFirebaseProgress(0, false);
    }
    setGameState('RESULT');
  };

  const updateFirebaseProgress = async (pointsEarned: number, win: boolean) => {
    if (!user) return;
    const progressPath = `users/${user.uid}/gameProgress/kesir-sefi`;
    const userPath = `users/${user.uid}`;
    
    try {
      const progressRef = doc(db, progressPath);
      await setDoc(progressRef, {
        gameId: 'Kesir Şefi',
        userId: user.uid,
        bestScore: pointsEarned,
        levelReached: win ? (userProfile?.level || 1) + 1 : (userProfile?.level || 1),
        lastPlayed: serverTimestamp()
      }, { merge: true });

      const userRef = doc(db, userPath);
      await setDoc(userRef, {
        totalStars: (userProfile?.totalStars || 0) + pointsEarned,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, progressPath);
    }
  };

  // SVG Helper Constants
  const viewBoxSize = 100;
  const radius = 45;
  const center = 50;

  const getSlicePath = (index: number, total: number) => {
    if (total === 1) {
      return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`;
    }

    const angle = 360 / total;
    const startAngle = (index * angle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * angle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
      <div className="bg-white rounded-[40px] shadow-2xl shadow-orange-100 border border-orange-50 overflow-hidden flex flex-col flex-1">
        {/* Header */}
        <div className="bg-orange-500 p-8 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <ChefHat className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Kesir Şefi</h1>
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest opacity-80">Mutfak Atölyesi</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-orange-400/50 px-6 py-3 rounded-3xl font-black flex items-center gap-2 border border-orange-300">
                <Star className="w-5 h-5 text-yellow-300 fill-current" /> SKOR: {score}
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-orange-50/30">
          {/* Background Decorative Elements */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {gameState === 'ORDER' && (
              <motion.div
                key="order"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-8 relative z-10"
              >
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-40 h-40 bg-white rounded-[45px] shadow-2xl flex items-center justify-center mx-auto border-4 border-orange-100"
                >
                  <Users className="w-20 h-20 text-orange-500" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-black text-indigo-950 uppercase mb-3 leading-tight tracking-tight">Yeni Bir Müşteri<br/>Sırada Bekliyor!</h2>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Sipariş hazırlandığında servis et</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateOrder}
                  className="bg-orange-500 text-white px-16 py-6 rounded-[30px] font-black text-xl shadow-2xl shadow-orange-200 border-b-4 border-orange-600 hover:bg-orange-400 transition-all uppercase"
                >
                  SİPARİŞİ AL
                </motion.button>
              </motion.div>
            )}

            {gameState === 'SLICING' && (
              <motion.div
                key="slicing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center gap-10 relative z-10"
              >
                <div className="flex gap-6 items-center">
                  <div className="bg-white px-10 py-6 rounded-[35px] shadow-xl border-2 border-indigo-100 text-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                      Sipariş
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-black text-indigo-600 leading-none">{targetNumerator}</span>
                      <div className="w-12 h-1.5 bg-indigo-600 my-2 rounded-full opacity-30"></div>
                      <span className="text-5xl font-black text-indigo-600 leading-none">{targetDenominator}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Seçilen: {selectedIndices.length}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-orange-400" /> Toplam Parça: {currentSlices}
                    </div>
                  </div>
                </div>

                {/* SVG Pizza Visual */}
                <div className="relative w-72 h-72 md:w-96 md:h-96 group">
                  <motion.div
                    className="absolute inset-0 bg-orange-100 rounded-full border-[12px] border-orange-200 shadow-2xl"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  />
                  <svg 
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
                    className="absolute inset-0 w-full h-full drop-shadow-lg overflow-visible"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                  >
                    <g transform={`rotate(0 ${center} ${center})`}>
                      {Array.from({ length: currentSlices }).map((_, i) => (
                        <motion.path
                          key={`${currentSlices}-${i}`}
                          d={getSlicePath(i, currentSlices)}
                          onClick={() => toggleSlice(i)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            fill: selectedIndices.includes(i) ? '#f97316' : '#fbbf24'
                          }}
                          whileHover={{ 
                            scale: 1.02,
                            stroke: '#f97316',
                            strokeWidth: 1,
                            zIndex: 10
                          }}
                          className="cursor-pointer transition-colors duration-200"
                          stroke={selectedIndices.includes(i) ? '#ea580c' : '#f59e0b'}
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                    </g>
                    {/* Pizza Center Point */}
                    <circle cx={center} cy={center} r="2" fill="#d97706" />
                  </svg>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSlice}
                    className="flex items-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-3xl font-black shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all uppercase text-sm"
                  >
                    <Pizza className="w-5 h-5" /> Dilimle ({currentSlices})
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={serveOrder}
                    disabled={selectedIndices.length === 0}
                    className="flex items-center gap-3 bg-emerald-500 text-white px-12 py-4 rounded-3xl font-black shadow-lg shadow-emerald-100 border-b-4 border-emerald-700 hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" /> SERVİS ET
                  </motion.button>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-slate-200 max-w-lg">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">Kural: Önce "Dilimle" butonuyla paydayı oluştur, sonra dilimlere dokunarak payı seç!</p>
                </div>
              </motion.div>
            )}

            {gameState === 'RESULT' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 relative z-10"
              >
                <div className="flex justify-center -space-x-4 mb-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-8xl"
                  >
                    🍕
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-7xl self-end"
                  >
                    {score > 0 ? '🤩' : '😢'}
                  </motion.div>
                </div>
                
                <div>
                  <h2 className={`text-4xl font-black uppercase mb-4 leading-tight ${score > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {feedback}
                  </h2>
                  <div className="inline-flex flex-col items-center p-10 bg-white rounded-[50px] shadow-2xl border-4 border-orange-50 min-w-[240px]">
                      <p className="text-slate-400 font-black uppercase text-xs mb-3 tracking-[0.3em] leading-none">Puan Kazandın</p>
                      <p className="text-7xl font-black text-orange-500">{score}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState('ORDER')}
                  className="bg-orange-500 text-white px-14 py-6 rounded-[35px] font-black text-xl shadow-2xl shadow-orange-200 flex items-center gap-4 mx-auto border-b-8 border-orange-600 hover:bg-orange-400 active:border-b-4 transition-all uppercase"
                >
                  <RotateCcw className="w-6 h-6" />
                  YENİ SİPARİŞ
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
