import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Newspaper,
  TrendingUp,
  Table as TableIcon,
  PieChart,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

type GameState = 'START' | 'COLLECT' | 'INTERPRET' | 'DEBATE' | 'RESULT';

interface RawData {
  category: string;
  count: number;
}

interface Question {
  data: RawData[];
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export default function AnketDedektifi() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentQuest, setCurrentQuest] = useState<Question | null>(null);
  const [questCount, setQuestCount] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-anket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setCurrentQuest(data);
      setQuestCount(prev => prev + 1);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (ans: boolean) => {
    if (!currentQuest) return;
    setSelectedAnswer(ans);
    const correct = ans === currentQuest.isTrue;
    if (correct) setScore(s => s + 20);
    setShowFeedback(true);
    await saveProgress(correct);
  };

  const saveProgress = async (correct: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/gameProgress/anket-dedektifi`;
    try {
      await setDoc(doc(db, path), {
        gameId: 'Anket Dedektifi',
        userId: user.uid,
        bestScore: score + (correct ? 20 : 0),
        levelReached: questCount,
        lastPlayed: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const nextQuest = async () => {
    if (questCount < 5) {
      setShowFeedback(false);
      setSelectedAnswer(null);
      await fetchQuestion();
    } else {
      setGameState('RESULT');
    }
  };

  const startGame = async () => {
    setQuestCount(0);
    setScore(0);
    setShowFeedback(false);
    setSelectedAnswer(null);
    setGameState('INTERPRET');
    await fetchQuestion();
  };

  const restart = () => {
    setGameState('START');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 h-full flex flex-col gap-6">
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[750px]">
        {/* Header HUD */}
        <div className="bg-slate-900 p-6 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">Anket Dedektifi</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">İstatistiksel Araştırma Süreci</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-800 px-4 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Skor</div>
              <div className="text-xl font-black text-indigo-400 tabular-nums">{score}</div>
            </div>
            <div className="bg-indigo-600 px-4 py-2 rounded-xl text-center min-w-[80px]">
                <div className="text-[10px] text-indigo-200 font-bold uppercase">Vaka</div>
                <div className="text-xl font-black text-white">{questCount}/5</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex">
          <AnimatePresence mode="wait">
            {gameState === 'START' && (
              <motion.div 
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10 bg-slate-50"
              >
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-32 h-32 bg-indigo-100 rounded-[40px] flex items-center justify-center mb-8 border-4 border-indigo-200"
                >
                  <Newspaper className="w-16 h-16 text-indigo-600" />
                </motion.div>
                <h2 className="text-4xl font-black text-slate-900 uppercase mb-4 leading-tight">Sahte Haberleri Tespit Et!</h2>
                <p className="max-w-md text-slate-500 font-medium mb-10">
                  Verileri incele, başkalarının yaptığı istatistiksel yorumları tartış ve hangilerinin doğru olduğunu bul. Gerçek bir veri dedektifi ol!
                </p>
                <button 
                  onClick={startGame}
                  className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase"
                >
                  Görevi Kabul Et
                </button>
              </motion.div>
            )}

            {gameState === 'INTERPRET' && (
              <motion.div 
                key="play"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex overflow-hidden relative"
              >
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">Yapay Zeka Yeni Vaka Hazırlıyor...</p>
                  </div>
                )}
                
                {currentQuest && (
                  <>
                    {/* Left: Data Visualization */}
                    <div className="w-1/2 p-8 border-r border-slate-100 flex flex-col gap-6 bg-slate-50/30">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Vaka Dosyası: Veri Özeti</span>
                      </div>

                      <div className="flex-1 bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center">
                        <div className="w-full flex flex-col gap-6">
                          {currentQuest.data.map((item, i) => (
                            <div key={i} className="flex flex-col gap-2">
                              <div className="flex justify-between text-xs font-black uppercase tracking-tighter text-slate-500">
                                 <span>{item.category}</span>
                                 <span>{item.count} Kişi</span>
                              </div>
                              <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.count / 25) * 100}%` }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-lg relative"
                                >
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-black">{item.count}</div>
                                </motion.div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                             <TableIcon className="w-6 h-6 text-indigo-400" />
                             <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Veri</div>
                                <div className="text-sm font-black text-slate-800">{currentQuest.data.reduce((a, b) => a + b.count, 0)}</div>
                             </div>
                        </div>
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                             <PieChart className="w-6 h-6 text-emerald-400" />
                             <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Kategoriler</div>
                                <div className="text-sm font-black text-slate-800">{currentQuest.data.length} Grup</div>
                             </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: The Claim */}
                    <div className="w-1/2 p-12 flex flex-col justify-center gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    <Users className="w-6 h-6 text-slate-400" />
                                 </div>
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Anket katılımcısının iddiası:</span>
                            </div>
                            <div className="bg-indigo-50 p-8 rounded-[40px] border-2 border-indigo-100 relative shadow-xl shadow-indigo-100/20">
                                <h3 className="text-2xl font-black text-indigo-950 italic leading-relaxed">
                                    "{currentQuest.statement}"
                                </h3>
                                <div className="absolute -bottom-3 right-8 w-6 h-6 bg-indigo-50 border-r-2 border-b-2 border-indigo-100 rotate-45" />
                            </div>
                        </div>

                        {!showFeedback ? (
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => handleAnswer(true)}
                                    disabled={loading}
                                    className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    Bu Yorum Doğru <CheckCircle2 className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={() => handleAnswer(false)}
                                    disabled={loading}
                                    className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    Bu Yorum Yanlış <AlertCircle className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-8 rounded-[40px] ${selectedAnswer === currentQuest.isTrue ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-100' : 'bg-rose-50 text-rose-900 border-2 border-rose-100'}`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {selectedAnswer === currentQuest.isTrue ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertCircle className="w-6 h-6 text-rose-500" />}
                                    <h4 className="text-lg font-black uppercase">{selectedAnswer === currentQuest.isTrue ? 'Başarılı Analiz!' : 'Hatalı Analiz!'}</h4>
                                </div>
                                <p className="font-bold text-sm leading-relaxed mb-6">
                                    {currentQuest.explanation}
                                </p>
                                <button 
                                    onClick={nextQuest}
                                    className="w-full bg-white text-slate-900 py-3 rounded-xl font-black uppercase text-xs border border-slate-200 shadow-sm"
                                >
                                    {questCount === 5 ? 'Sonuçları Gör' : 'Sıradaki Vaka'}
                                </button>
                            </motion.div>
                        )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {gameState === 'RESULT' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-900"
              >
                  <div className="mb-8">
                     <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/20">
                        <TrendingUp className="w-12 h-12 text-white" />
                     </div>
                     <h2 className="text-4xl font-black text-white uppercase italic">Soruşturma Tamamlandı!</h2>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[40px] border border-white/20 mb-10 w-full max-w-sm">
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] mb-4">Uzmanlık Puanı</p>
                      <div className="text-7xl font-black text-white">{score}</div>
                  </div>

                  <button 
                    onClick={restart}
                    className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center gap-3"
                  >
                    <RotateCcw className="w-6 h-6" /> Tekrar Oyna
                  </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
