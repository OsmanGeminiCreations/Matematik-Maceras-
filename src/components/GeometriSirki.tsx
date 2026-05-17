import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Circle, 
  CircleDot,
  Square, 
  ArrowRight, 
  MoveHorizontal, 
  Zap, 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  MousePointer2,
  Spline,
  LayoutGrid,
  Plus,
  Disc,
  ArrowUpRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

type Tool = 'POINT' | 'SEGMENT' | 'RAY' | 'LINE' | 'PARALLEL' | 'PERPENDICULAR' | 'CIRCLE' | 'DISC';

interface Point {
  x: number;
  y: number;
  id: string;
}

interface Shape {
  type: Tool;
  points: string[]; // point IDs
  id: string;
  radius?: number;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  targetTool: Tool;
  instruction: string;
  validation: (shapes: Shape[], points: Point[]) => boolean;
}

const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Noktalar Arasında",
    description: "İki arkadaş nokta arasına bir köprü (Doğru Parçası) kur.",
    targetTool: 'SEGMENT',
    instruction: "İki noktayı seçerek bir doğru parçası oluştur.",
    validation: (shapes) => shapes.some(s => s.type === 'SEGMENT')
  },
  {
    id: 2,
    title: "Sonsuz Işın",
    description: "Bir noktadan başlayıp diğerinden sonsuza uzanan bir ışın gönder.",
    targetTool: 'RAY',
    instruction: "Başlangıç ve yön noktasını seç.",
    validation: (shapes) => shapes.some(s => s.type === 'RAY')
  },
  {
    id: 3,
    title: "Zıt Kutuplar",
    description: "İki noktadan geçen ve her iki yönde sonsuza uzanan bir doğru çiz.",
    targetTool: 'LINE',
    instruction: "Her iki yöne uzanan doğruyu oluştur.",
    validation: (shapes) => shapes.some(s => s.type === 'LINE')
  },
  {
    id: 4,
    title: "Paralel Raylar",
    description: "Var olan çizgiye hiç kavuşamayacak bir paralel çizgi ekle.",
    targetTool: 'PARALLEL',
    instruction: "Kılavuz çizgiyi seç ve yeni çizgini paralel hale getir.",
    validation: (shapes) => shapes.some(s => s.type === 'PARALLEL')
  },
  {
    id: 5,
    title: "Güneşin Kalbi",
    description: "Bir merkez nokta seç ve etrafına mükemmel bir çember çiz.",
    targetTool: 'CIRCLE',
    instruction: "Merkez noktayı ve yarıçapı belirlemek için ikinci noktayı seç.",
    validation: (shapes) => shapes.some(s => s.type === 'CIRCLE')
  },
  {
    id: 6,
    title: "Geometrinin İçi",
    description: "İçi dolu bir geometri şekli oluştur: Bir Daire çiz.",
    targetTool: 'DISC',
    instruction: "Merkez ve kenar noktasını seçerek alanı doldur.",
    validation: (shapes) => shapes.some(s => s.type === 'DISC')
  }
];

export default function GeometriSirki() {
  const { user, userProfile } = useAuth();
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const [selectedTool, setSelectedTool] = useState<Tool>('POINT');
  const [points, setPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'PLAYING' | 'SUCCESS' | 'FAIL'>('PLAYING');
  const [score, setScore] = useState(0);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const mission = MISSIONS[currentMissionIdx];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState !== 'PLAYING') return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'POINT') {
      const newPoint: Point = { x, y, id: Math.random().toString(36).substr(2, 9) };
      setPoints([...points, newPoint]);
    } else {
      // Auto-create point and select it if in drawing mode
      const newPoint: Point = { x, y, id: Math.random().toString(36).substr(2, 9) };
      const updatedPoints = [...points, newPoint];
      setPoints(updatedPoints);
      handlePointClick(newPoint.id, e as any, updatedPoints);
    }
  };

  const handlePointClick = (id: string, e: React.MouseEvent, overridePoints?: Point[]) => {
    e.stopPropagation();
    if (gameState !== 'PLAYING') return;

    const currentPoints = overridePoints || points;

    if (selectedPointIds.includes(id)) {
      setSelectedPointIds(selectedPointIds.filter(pid => pid !== id));
      return;
    }

    const newSelection = [...selectedPointIds, id];
    
    if (newSelection.length === 2) {
      if (['SEGMENT', 'RAY', 'LINE', 'PARALLEL', 'PERPENDICULAR', 'CIRCLE', 'DISC'].includes(selectedTool)) {
        let radius = 0;
        if (selectedTool === 'CIRCLE' || selectedTool === 'DISC') {
            const p1 = currentPoints.find(p => p.id === newSelection[0]);
            const p2 = currentPoints.find(p => p.id === newSelection[1]);
            if (p1 && p2) {
                radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            }
        }
        const newShape: Shape = {
          type: selectedTool,
          points: newSelection,
          id: Math.random().toString(36).substr(2, 9),
          radius: radius > 0 ? radius : undefined
        };
        setShapes([...shapes, newShape]);
        setSelectedPointIds([]);
      }
    } else {
      setSelectedPointIds(newSelection);
    }
  };

  const checkMission = async () => {
    if (mission.validation(shapes, points)) {
      setGameState('SUCCESS');
      const pointsEarned = 25;
      setScore(prev => prev + pointsEarned);
      await updateFirebaseProgress(pointsEarned, true);
    } else {
      setGameState('FAIL');
    }
  };

  const updateFirebaseProgress = async (pointsEarned: number, win: boolean) => {
    if (!user) return;
    const progressPath = `users/${user.uid}/gameProgress/geometri-sirki`;
    const userPath = `users/${user.uid}`;
    
    try {
      const progressRef = doc(db, progressPath);
      await setDoc(progressRef, {
        gameId: 'Geometri Sirki',
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

  const nextMission = () => {
    if (currentMissionIdx < MISSIONS.length - 1) {
      setCurrentMissionIdx(currentMissionIdx + 1);
      resetLevel();
    }
  };

  const resetLevel = () => {
    setPoints([]);
    setShapes([]);
    setSelectedPointIds([]);
    setGameState('PLAYING');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col gap-6 h-full">
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[750px]">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Spline className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider">Geometri Sirki</h1>
                <p className="text-indigo-100 text-xs font-bold uppercase opacity-80">Görev {mission.id}: {mission.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 px-4 py-2 rounded-2xl font-bold flex items-center gap-2 border border-indigo-400">
                <Zap className="w-5 h-5 text-yellow-300 fill-current" /> Puan: {score}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tools */}
          <div className="w-24 bg-slate-50 border-r border-slate-100 p-4 flex flex-col gap-4 items-center shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Araçlar</span>
            
            <ToolButton 
              icon={Plus} 
              active={selectedTool === 'POINT'} 
              onClick={() => setSelectedTool('POINT')}
              label="Nokta"
            />
            <ToolButton 
              icon={CircleDot} 
              active={selectedTool === 'CIRCLE'} 
              onClick={() => setSelectedTool('CIRCLE')}
              label="Çember"
            />
            <ToolButton 
              icon={Disc} 
              active={selectedTool === 'DISC'} 
              onClick={() => setSelectedTool('DISC')}
              label="Daire"
            />
            <ToolButton 
              icon={MoveHorizontal} 
              active={selectedTool === 'SEGMENT'} 
              onClick={() => setSelectedTool('SEGMENT')}
              label="P.Doğru"
            />
            <ToolButton 
              icon={ArrowRight} 
              active={selectedTool === 'RAY'} 
              onClick={() => setSelectedTool('RAY')}
              label="Işın"
            />
            <ToolButton 
              icon={LayoutGrid} 
              active={selectedTool === 'LINE'} 
              onClick={() => setSelectedTool('LINE')}
              label="Doğru"
            />
            <ToolButton 
              icon={ArrowUpRight} 
              active={selectedTool === 'PARALLEL'} 
              onClick={() => setSelectedTool('PARALLEL')}
              label="Paralel"
            />
            <ToolButton 
              icon={Menu} 
              active={selectedTool === 'PERPENDICULAR'} 
              onClick={() => setSelectedTool('PERPENDICULAR')}
              label="Dikme"
            />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-slate-50/50 flex flex-col">
            <div className="absolute top-6 left-6 right-6 z-10">
              <motion.div 
                key={mission.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-3xl shadow-xl border border-indigo-50 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-indigo-950 uppercase text-sm">{mission.description}</h3>
                  <p className="text-slate-500 text-xs font-bold">{mission.instruction}</p>
                </div>
              </motion.div>
            </div>

            <div 
              ref={containerRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="flex-1 relative cursor-crosshair overflow-hidden touch-none"
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              <svg className="w-full h-full">
                {/* Ghost Preview */}
                {selectedPointIds.length === 1 && (
                  <g className="opacity-40 pointer-events-none">
                    {(() => {
                      const p1 = points.find(p => p.id === selectedPointIds[0]);
                      if (!p1) return null;

                      if (selectedTool === 'SEGMENT') {
                        return <line x1={p1.x} y1={p1.y} x2={mousePos.x} y2={mousePos.y} stroke="#4f46e5" strokeWidth="4" strokeDasharray="8,4" />;
                      }
                      if (selectedTool === 'CIRCLE' || selectedTool === 'DISC') {
                        const r = Math.sqrt(Math.pow(mousePos.x - p1.x, 2) + Math.pow(mousePos.y - p1.y, 2));
                        return <circle cx={p1.x} cy={p1.y} r={r} fill={selectedTool === 'DISC' ? "rgba(79, 70, 229, 0.2)" : "rgba(79, 70, 229, 0.1)"} stroke="#4f46e5" strokeWidth="2" strokeDasharray="8,4" />;
                      }
                      if (selectedTool === 'RAY') {
                        const angle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
                        const dx = Math.cos(angle) * 2000;
                        const dy = Math.sin(angle) * 2000;
                        return <line x1={p1.x} y1={p1.y} x2={p1.x + dx} y2={p1.y + dy} stroke="#4f46e5" strokeWidth="4" strokeDasharray="8,4" />;
                      }
                      if (selectedTool === 'LINE' || selectedTool === 'PARALLEL' || selectedTool === 'PERPENDICULAR') {
                        const angle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
                        const dx = Math.cos(angle) * 2000;
                        const dy = Math.sin(angle) * 2000;
                        return <line x1={p1.x - dx} y1={p1.y - dy} x2={p1.x + dx} y2={p1.y + dy} stroke={selectedTool === 'PARALLEL' ? '#10b981' : selectedTool === 'PERPENDICULAR' ? '#f59e0b' : '#4f46e5'} strokeWidth="4" strokeDasharray="8,4" />;
                      }
                      return null;
                    })()}
                  </g>
                )}
                {/* Draw Shapes */}
                {shapes.map((shape) => {
                  const p1 = points.find(p => p.id === shape.points[0]);
                  const p2 = points.find(p => p.id === shape.points[1]);
                  if (!p1 || !p2) return null;

                  if (shape.type === 'SEGMENT') {
                    return (
                      <line 
                        key={shape.id}
                        x1={p1.x} y1={p1.y}
                        x2={p2.x} y2={p2.y}
                        stroke="#4f46e5"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    );
                  }

                  if (shape.type === 'RAY') {
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const dx = Math.cos(angle) * 2000;
                    const dy = Math.sin(angle) * 2000;
                    return (
                      <g key={shape.id}>
                        <line 
                          x1={p1.x} y1={p1.y}
                          x2={p1.x + dx} y2={p1.y + dy}
                          stroke="#4f46e5"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <circle cx={p1.x} cy={p1.y} r="6" fill="#4f46e5" />
                      </g>
                    );
                  }

                  if (shape.type === 'LINE' || shape.type === 'PARALLEL' || shape.type === 'PERPENDICULAR') {
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const dx = Math.cos(angle) * 2000;
                    const dy = Math.sin(angle) * 2000;
                    return (
                      <line 
                        key={shape.id}
                        x1={p1.x - dx} y1={p1.y - dy}
                        x2={p1.x + dx} y2={p1.y + dy}
                        stroke={shape.type === 'PARALLEL' ? '#10b981' : shape.type === 'PERPENDICULAR' ? '#f59e0b' : '#4f46e5'}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    );
                  }

                  if (shape.type === 'CIRCLE' || shape.type === 'DISC') {
                    return (
                      <circle 
                        key={shape.id}
                        cx={p1.x} cy={p1.y}
                        r={shape.radius}
                        fill={shape.type === 'DISC' ? "rgba(79, 70, 229, 0.6)" : "rgba(79, 70, 229, 0.1)"}
                        stroke="#4f46e5"
                        strokeWidth="4"
                      />
                    );
                  }

                  return null;
                })}

                {/* Draw Points */}
                {points.map((p) => (
                  <motion.g
                    key={p.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                    onClick={(e) => handlePointClick(p.id, e)}
                    className="cursor-pointer"
                  >
                    <circle 
                      cx={p.x} cy={p.y} r="12" 
                      fill="white" 
                      stroke={selectedPointIds.includes(p.id) ? '#4f46e5' : '#e2e8f0'} 
                      strokeWidth="3"
                    />
                    <circle 
                      cx={p.x} cy={p.y} r="5" 
                      fill={selectedPointIds.includes(p.id) ? '#4f46e5' : '#cbd5e1'} 
                    />
                  </motion.g>
                ))}
              </svg>

              <AnimatePresence>
                {gameState !== 'PLAYING' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm flex items-center justify-center p-6 z-50"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-sm w-full"
                    >
                      {gameState === 'SUCCESS' ? (
                        <>
                          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-500">
                            <Trophy className="w-10 h-10" />
                          </div>
                          <h2 className="text-3xl font-black text-indigo-950 uppercase mb-2">
                            {currentMissionIdx === MISSIONS.length - 1 ? 'Muhteşem!' : 'Harika!'}
                          </h2>
                          <p className="text-slate-500 font-bold mb-8">
                            {currentMissionIdx === MISSIONS.length - 1 
                              ? 'Tüm Geometri Sirki görevlerini başarıyla tamamladın. Sen gerçek bir geometri ustasısın!' 
                              : 'Geometrinin dilini çok iyi anlıyorsun.'}
                          </p>
                          <div className="flex flex-col gap-3">
                            {currentMissionIdx < MISSIONS.length - 1 ? (
                              <button 
                                onClick={nextMission}
                                className="bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                              >
                                Sıradaki Görev <CheckCircle2 className="w-5 h-5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setCurrentMissionIdx(0);
                                  resetLevel();
                                  setScore(0);
                                }}
                                className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                              >
                                Baştan Başla <RotateCcw className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                                onClick={resetLevel}
                                className="bg-slate-100 text-slate-500 py-3 rounded-2xl font-black uppercase text-xs"
                            >
                                {currentMissionIdx === MISSIONS.length - 1 ? 'Çalışmanı Gör' : 'Tekrarla'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                            <AlertCircle className="w-10 h-10" />
                          </div>
                          <h2 className="text-3xl font-black text-indigo-950 uppercase mb-2">Eyvah!</h2>
                          <p className="text-slate-500 font-bold mb-8">Bu şekil tam beklediğimiz gibi olmadı.</p>
                          <button 
                            onClick={resetLevel}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                          >
                            Tekrar Dene <RotateCcw className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-slate-400">
                <MousePointer2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {selectedTool === 'POINT' ? 'Ekrana tıkla ve nokta koy' : 'İki nokta seç ve şekil oluştur'}
                </span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={resetLevel}
                  className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-colors"
                >
                  Temizle
                </button>
                <button 
                  onClick={checkMission}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                >
                  Kontrol Et
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
          active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
        }`}
      >
        <Icon className="w-6 h-6" />
      </motion.button>
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
