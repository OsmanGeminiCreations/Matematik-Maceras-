import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, BarChart3, Plus, Trash2, Send, RotateCcw } from 'lucide-react';
import { aiService, SurveySimulation } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

type GameState = 'CREATION' | 'VALIDATING' | 'SIMULATING' | 'TABLE_ENTRY' | 'RESULT';

export default function IstatistikRush() {
  const { user, userProfile } = useAuth();
  const [gameState, setGameState] = useState<GameState>('CREATION');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [validationResult, setValidationResult] = useState<{ isSuitable: boolean; reason: string } | null>(null);
  const [simulationData, setSimulationData] = useState<SurveySimulation | null>(null);
  const [userFrequencies, setUserFrequencies] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const startGame = async () => {
    if (!question || options.some(opt => !opt)) {
      alert('Lütfen soruyu ve tüm seçenekleri doldurun.');
      return;
    }

    setGameState('VALIDATING');
    const result = await aiService.validateSurvey(question, options);
    setValidationResult(result);

    if (result.isSuitable) {
      setScore(5);
      setGameState('SIMULATING');
      const simulation = await aiService.simulateSurveyAnswers(question, options);
      setSimulationData(simulation);
      const initialFreq: { [key: string]: string } = {};
      options.forEach(opt => initialFreq[opt] = '');
      setUserFrequencies(initialFreq);
      setGameState('TABLE_ENTRY');
    } else {
      setScore(0);
      setGameState('RESULT');
      setMessage(result.reason);
    }
  };

  const checkTable = async () => {
    if (!simulationData) return;

    let isCorrect = true;
    options.forEach(opt => {
      if (parseInt(userFrequencies[opt]) !== simulationData.results[opt]) {
        isCorrect = false;
      }
    });

    if (isCorrect) {
      const finalScore = score + 10;
      setScore(finalScore);
      setMessage('Harika! Sıklık tablosunu doğru doldurdun.');
      await updateFirebaseProgress(finalScore, true);
    } else {
      setScore(0);
      setMessage('Hayır, tablodaki veriler yanlış. Oyun bitti.');
      await updateFirebaseProgress(0, false);
    }
    setGameState('RESULT');
  };

  const updateFirebaseProgress = async (finalScore: number, win: boolean) => {
    if (!user) return;
    const progressRef = doc(db, `users/${user.uid}/gameProgress`, 'istatistik-rush');
    await setDoc(progressRef, {
      gameId: 'İstatistik Rush!',
      userId: user.uid,
      bestScore: finalScore,
      levelReached: win ? (userProfile?.level || 1) + 1 : (userProfile?.level || 1),
      lastPlayed: serverTimestamp()
    }, { merge: true });

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      totalStars: (userProfile?.totalStars || 0) + finalScore,
      level: win ? (userProfile?.level || 1) + 1 : (userProfile?.level || 1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const resetGame = () => {
    setGameState('CREATION');
    setQuestion('');
    setOptions(['', '']);
    setScore(0);
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              <h1 className="text-3xl font-black uppercase tracking-tight">İstatistik Rush!</h1>
            </div>
            <div className="bg-indigo-500/50 px-4 py-2 rounded-2xl font-bold">
              Skor: {score}
            </div>
          </div>
          <p className="opacity-90 font-medium">Kendi anketini oluştur, Gemini cevaplasın, sen de sıklık tablosunu oluştur!</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {gameState === 'CREATION' && (
              <motion.div
                key="creation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-indigo-950 font-black uppercase text-sm mb-2">Anket Sorusu</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Örn: En sevdiğiniz meyve hangisidir?"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-indigo-950 font-black uppercase text-sm mb-2">Seçenekler (En az 2, en fazla 5)</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Seçenek ${i + 1}`}
                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all"
                      />
                      {options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button
                      onClick={addOption}
                      className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Seçenek Ekle
                    </button>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGame}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-3"
                >
                  <Send className="w-6 h-6" />
                  ANKETİ BAŞLAT
                </motion.button>
              </motion.div>
            )}

            {(gameState === 'VALIDATING' || gameState === 'SIMULATING') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center space-y-6"
              >
                <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h2 className="text-2xl font-black text-indigo-950 uppercase">Gemini Analiz Ediyor...</h2>
                  <p className="text-slate-500 font-medium mt-2">
                    {gameState === 'VALIDATING' ? 'Anketin uygunluğu kontrol ediliyor.' : 'Yapay zeka modelleri anketi yanıtlıyor...'}
                  </p>
                </div>
              </motion.div>
            )}

            {gameState === 'TABLE_ENTRY' && simulationData && (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100">
                  <h3 className="text-lg font-black text-indigo-950 uppercase mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Gemini Yanıtları
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {simulationData.rawAnswers.map((answer, i) => (
                      <span key={i} className="bg-white px-4 py-2 rounded-xl border border-indigo-200 font-bold text-indigo-600 shadow-sm">
                        {answer}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-indigo-400 font-medium">Toplam 10 kişi yanıtladı. Yukarıdaki verilere göre bir sıklık tablosu oluştur.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-black text-indigo-950 uppercase">Sıklık Tablosu</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100 p-4 rounded-xl font-black text-slate-500 uppercase text-center">Seçenek</div>
                    <div className="bg-slate-100 p-4 rounded-xl font-black text-slate-500 uppercase text-center">Sıklık (Kişi Sayısı)</div>
                    {options.map((opt, i) => (
                      <React.Fragment key={i}>
                        <div className="flex items-center justify-center p-4 font-bold text-indigo-950 bg-white border border-slate-200 rounded-xl">
                          {opt}
                        </div>
                        <input
                          type="number"
                          value={userFrequencies[opt]}
                          onChange={(e) => setUserFrequencies({...userFrequencies, [opt]: e.target.value})}
                          className="p-4 text-center bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xl focus:border-indigo-500 transition-all outline-none"
                          placeholder="?"
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={checkTable}
                  className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-emerald-200"
                >
                  TABLOYU KONTROL ET
                </motion.button>
              </motion.div>
            )}

            {gameState === 'RESULT' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-8"
              >
                <div className="flex justify-center">
                  {score > 0 ? (
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-16 h-16" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                      <XCircle className="w-16 h-16" />
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-4xl font-black text-indigo-950 uppercase mb-2">
                    {score > 0 ? 'Tebrikler!' : 'Oyun Bitti'}
                  </h2>
                  <p className="text-xl font-medium text-slate-500">{message}</p>
                </div>

                <div className="p-8 bg-slate-50 rounded-[40px] max-w-sm mx-auto">
                  <p className="text-slate-400 font-black uppercase text-sm mb-1 tracking-widest">Kazanılan Skor</p>
                  <p className="text-6xl font-black text-indigo-600">{score}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-xl shadow-indigo-200 flex items-center gap-3 mx-auto"
                >
                  <RotateCcw className="w-6 h-6" />
                  YENİDEN DENE
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
