import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Info, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[100] max-w-xl mx-auto"
        >
          <div className="bg-neutral-900 text-white rounded-[2.5rem] p-6 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Info size={24} weight="bold" className="text-neutral-400" />
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold leading-relaxed text-neutral-300">
                Usamos cookies para mejorar tu experiencia y sincronizar tus gastos de forma segura.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleAccept}
                className="flex-1 sm:flex-none h-12 px-8 rounded-2xl bg-white text-neutral-900 font-black hover:bg-neutral-100 transition-all active:scale-95"
              >
                Aceptar
              </Button>
              <button
                onClick={() => setShow(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
