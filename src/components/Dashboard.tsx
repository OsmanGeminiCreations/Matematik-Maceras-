import { motion } from 'motion/react';
import Navigation from './Navigation';
import { Sparkles, Trophy, Star, Target, Gamepad2, Pizza, BarChart3, Spline, Scale, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import IstatistikRush from './IstatistikRush';
import KesirSefi from './KesirSefi';
import GeometriSirki from './GeometriSirki';
import KesirMaratonu from './KesirMaratonu';
import AnketDedektifi from './AnketDedektifi';

type ViewState = 'HOME' | 'ISTATISTIK_RUSH' | 'KESIR_SEFI' | 'GEOMETRI_SIRKI' | 'KESIR_MARATONU' | 'ANKET_DEDEKTIFI';

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<ViewState>('HOME');

  useEffect(() => {
    async function fetchStats() {
      if (user) {
        const q = query(collection(db, `users/${user.uid}/gameProgress`));
        const querySnapshot = await getDocs(q);
        const stats = querySnapshot.docs.map(doc => doc.data());
        setGameStats(stats);
      }
    }
    fetchStats();
  }, [user, activeView]);

  const renderActiveGame = () => {
    switch (activeView) {
      case 'ISTATISTIK_RUSH':
        return <IstatistikRush />;
      case 'KESIR_SEFI':
        return <KesirSefi />;
      case 'GEOMETRI_SIRKI':
        return <GeometriSirki />;
      case 'KESIR_MARATONU':
        return <KesirMaratonu />;
      case 'ANKET_DEDEKTIFI':
        return <AnketDedektifi />;
      default:
        return null;
    }
  };

  if (activeView !== 'HOME') {
    return (
      <div className="min-h-screen bg-slate-50 text-indigo-950 font-sans flex overflow-hidden">
        <Navigation />
        <main className="flex-1 pl-24 p-8 flex flex-col gap-8 overflow-y-auto h-screen">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setActiveView('HOME')}
            className="text-indigo-600 font-black flex items-center gap-2 hover:translate-x-[-4px] transition-transform w-fit uppercase tracking-wider text-sm"
          >
            ← Ana Menüye Dön
          </motion.button>
          {renderActiveGame()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-indigo-950 font-sans flex overflow-hidden">
      <Navigation />
      
      <main className="flex-1 pl-24 p-8 flex flex-col gap-8 overflow-y-auto h-screen">
        {/* Header */}
        <header className="flex justify-between items-center max-w-7xl">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 uppercase tracking-tight">
              Selam, {userProfile?.displayName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 font-medium tracking-wide">Bugün hangi matematik canavarını yeneceksin?</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-yellow-100 px-5 py-2 rounded-full flex items-center gap-2 border border-yellow-200 shadow-sm">
              <Star className="w-5 h-5 text-yellow-600 fill-current" />
              <span className="font-bold text-yellow-700 text-lg">{userProfile?.totalStars || 0}</span>
            </div>
            <div className="bg-blue-100 px-5 py-2 rounded-full flex items-center gap-2 border border-blue-200 shadow-sm">
              <Trophy className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-700 text-lg">Sv {userProfile?.level || 1}</span>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 grid-rows-6 gap-6 flex-1 max-w-7xl">
          {/* Main Games Grid */}
          <div className="col-span-12 lg:col-span-8 row-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game 1: Istatistik Rush */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => setActiveView('ISTATISTIK_RUSH')}
              className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-100 cursor-pointer group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mb-6 backdrop-blur-md">📊</div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">İstatistik<br/>Rush!</h2>
                <p className="mt-4 text-indigo-100 text-sm font-medium opacity-80 line-clamp-2">
                  Gemini modelleriyle anket yap ve verileri doğru analiz et.
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-8">
                <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase">Orta Seviye</span>
                <div className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-indigo-500 rounded-full opacity-20 group-hover:scale-110 transition-transform"></div>
            </motion.div>

            {/* Game 2: Kesir Sefi */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => setActiveView('KESIR_SEFI')}
              className="bg-orange-500 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-orange-100 cursor-pointer group"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mb-6 backdrop-blur-md">🍕</div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Kesir<br/>Şefi</h2>
                <p className="mt-4 text-orange-50 text-sm font-medium opacity-80 line-clamp-2">
                  Müşterilere doğru kesirlerde pizza servisi yap ve mutfak şefi ol!
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-8">
                <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase">Kolay Seviye</span>
                <div className="w-12 h-12 bg-white text-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Pizza className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-orange-400 rounded-full opacity-20 group-hover:scale-110 transition-transform"></div>
            </motion.div>

            {/* Game 3: Geometri Sirki */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => setActiveView('GEOMETRI_SIRKI')}
              className="bg-emerald-500 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-emerald-100 cursor-pointer lg:col-span-2 group"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-md">📐</div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Geometri<br/>Sirki</h2>
                  <p className="mt-2 text-emerald-50 text-sm font-medium opacity-80 max-w-md">
                    Noktalar, doğrular ve ışınlarla geometrik labirentleri çöz!
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-8">
                <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase">Yeni Teknik</span>
                <div className="w-12 h-12 bg-white text-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Spline className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-emerald-400 rounded-full opacity-20 group-hover:scale-110 transition-transform"></div>
            </motion.div>

            {/* Game 4: Kesir Maratonu */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => setActiveView('KESIR_MARATONU')}
              className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-cyan-100 cursor-pointer lg:col-span-2 group border-4 border-slate-800"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-md border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">🏃‍♂️</div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none italic">Kesir<br/>Maratonu</h2>
                  <p className="mt-2 text-cyan-50 text-sm font-medium opacity-60 max-w-md">
                    Farklı gösterimleri saniyeler içinde karşılaştır, en hızlı kararı ver, yarışı kazan!
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-8">
                <span className="bg-cyan-500/20 px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase text-cyan-400 border border-cyan-500/30">Hız & Mantık</span>
                <div className="w-12 h-12 bg-cyan-500 text-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    <Scale className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute right-[-40px] bottom-[-40px] w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </motion.div>

            {/* Game 5: Anket Dedektifi */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => setActiveView('ANKET_DEDEKTIFI')}
              className="bg-white rounded-[40px] p-8 text-slate-900 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-100 cursor-pointer lg:col-span-2 group border border-slate-100"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-4xl shadow-xl shadow-indigo-200">🕵️‍♂️</div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-slate-900">Anket<br/>Dedektifi</h2>
                  <p className="mt-2 text-slate-500 text-sm font-medium max-w-md">
                    Verileri analiz et, sahte istatistikleri yakala ve veriye dayalı kararlar vermeyi öğren!
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-8">
                <span className="bg-indigo-50 px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase text-indigo-600 border border-indigo-100">Veri Analizi</span>
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-200">
                    <Search className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            </motion.div>
          </div>

          {/* Daily Goal */}
          <div className="col-span-12 lg:col-span-4 row-span-2 bg-rose-500 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Günün<br/>Görevi</h3>
              <p className="mt-3 opacity-90 font-medium text-sm">3 Anket tamamla veya 5 Pizza servis et!</p>
            </div>
            <div className="relative z-10 flex items-center justify-between text-right">
              <Target className="w-10 h-10 opacity-50" />
              <div className="text-4xl font-black">0 / 1</div>
            </div>
          </div>

          {/* Leaderboard/Progress Preview */}
          <div className="col-span-12 lg:col-span-4 row-span-2 bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">En İyi Skorun</span>
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-5xl font-black text-indigo-950">
                {gameStats.reduce((max, stat) => Math.max(max, stat.bestScore || 0), 0)}
              </span>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">Haftalık Rekorun</p>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-4">
              <div className="bg-indigo-600 h-full w-3/4 rounded-full"></div>
            </div>
          </div>

          {/* My Progress History */}
          <div className="col-span-12 row-span-2 bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm overflow-hidden text-indigo-950">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight">Oyun Geçmişin</h3>
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameStats.length > 0 ? gameStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-[24px] bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full border-2 border-indigo-100 flex items-center justify-center font-bold text-indigo-600 uppercase">
                      {stat.gameId?.charAt(0)}
                    </div>
                    <span className="font-black text-lg tracking-tight uppercase">{stat.gameId}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-xl text-indigo-600">{stat.bestScore} Puan</span>
                    <span className="text-xs font-bold text-slate-400 capitalize">Seviye {stat.levelReached}</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-4 flex flex-col items-center gap-2">
                  <Gamepad2 className="w-10 h-10 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Henüz veri yok.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
