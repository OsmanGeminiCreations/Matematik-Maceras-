import { Home, Gamepad2, Trophy, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, userProfile, logout } = useAuth();
  
  const navItems = [
    { icon: Home, label: 'Ana Sayfa', href: '#', active: true },
    { icon: Gamepad2, label: 'Oyunlar', href: '#' },
    { icon: Trophy, label: 'Başarılar', href: '#' },
    { icon: Settings, label: 'Ayarlar', href: '#' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-24 bg-white border-r border-slate-200 flex flex-col items-center py-8 z-50">
      <div className="mb-10">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200 cursor-pointer"
        >
          M+
        </motion.div>
      </div>

      <nav className="flex-1 space-y-8 flex flex-col items-center">
        {navItems.map((item, index) => (
          <motion.a
            key={index}
            href={item.href}
            whileHover={{ scale: 1.1 }}
            className={`p-3 rounded-xl transition-all ${
              item.active 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-indigo-600'
            }`}
          >
            <item.icon className="w-8 h-8" />
          </motion.a>
        ))}
      </nav>

      <div className="mt-auto space-y-6 flex flex-col items-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={logout}
          className="p-3 text-slate-400 hover:text-red-500 transition-colors"
          title="Çıkış Yap"
        >
          <LogOut className="w-8 h-8" />
        </motion.button>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden cursor-pointer"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
              {userProfile?.displayName?.charAt(0) || 'U'}
            </div>
          )}
        </motion.div>
      </div>
    </nav>
  );
}
