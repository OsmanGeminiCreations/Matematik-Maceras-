import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-indigo-100 text-center border border-slate-100"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-indigo-200 mx-auto mb-8">
          M+
        </div>
        
        <h1 className="text-4xl font-black text-indigo-950 uppercase tracking-tight mb-4">
          Matematik Macerası
        </h1>
        
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Sayıların büyülü dünyasına katılmak ve başarılarını kaydetmek için giriş yap!
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loginWithGoogle}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          <LogIn className="w-6 h-6" />
          Google ile Giriş Yap
        </motion.button>

        <div className="mt-8 flex items-center justify-center gap-2 text-indigo-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Eğlence ve Öğrenme Seni Bekliyor!</span>
        </div>
      </motion.div>
    </div>
  );
}
