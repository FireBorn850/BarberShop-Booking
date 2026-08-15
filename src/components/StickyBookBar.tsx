import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StickyBookBarProps {
  onBookClick: () => void;
}

export const StickyBookBar: React.FC<StickyBookBarProps> = ({ onBookClick }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white/95 dark:bg-[#0C0C0C]/95 backdrop-blur-md border-t border-zinc-200 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)] px-4 py-3">
        <button
          onClick={onBookClick}
          className="w-full py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-md"
        >
          <Calendar className="w-4 h-4" />
          {t('hero.reserveChair')}
        </button>
      </div>
    </div>
  );
};