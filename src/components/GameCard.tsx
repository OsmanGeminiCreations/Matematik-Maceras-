import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import React from 'react';

export interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, color, difficulty }) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Kolay': return 'bg-green-100 text-green-600';
      case 'Orta': return 'bg-orange-100 text-orange-600';
      case 'Zor': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer group"
    >
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner`}>
        {icon}
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
              ★
            </div>
          ))}
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center group-hover:bg-indigo-700 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GameCard;
