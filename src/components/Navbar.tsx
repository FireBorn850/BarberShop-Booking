import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarbershopSettings } from '../types';

interface NavbarProps {
  settings: BarbershopSettings;
  onBookClick: () => void;
  onAdminClick: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onBookClick,
}) => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-zinc-200 dark:border-stone-800 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#0C0C0C]/95 backdrop-blur-md py-3 shadow-md dark:shadow-2xl'
          : 'bg-white dark:bg-[#0C0C0C] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 gap-4">
          {/* Brand Logo - Geometric Balance square mark & serif title */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none shrink-0"
            id="navbar-brand-link"
          >
            <div className="w-8 h-8 bg-amber-600 rounded-sm flex items-center justify-center font-serif text-lg font-bold text-black group-hover:bg-amber-500 transition-colors shrink-0">
              {settings.barbershop_name ? settings.barbershop_name.charAt(0) : 'C'}
            </div>
            <div className="hidden sm:block">
              <span className="block tracking-[0.2em] font-serif text-base sm:text-lg uppercase text-zinc-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors whitespace-nowrap">
                {settings.barbershop_name || 'Crown & Cut'}
              </span>
              <span className="block text-[9px] tracking-[0.25em] text-amber-600 dark:text-amber-500 uppercase -mt-0.5 font-medium whitespace-nowrap">
                {t('navbar.tagline')}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs tracking-wider uppercase text-zinc-600 dark:text-stone-400 font-medium shrink-0">
            <a
              href="#services"
              className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors whitespace-nowrap"
              id="nav-services-link"
            >
              {t('navbar.services')}
            </a>
            <a
              href="#about"
              className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors whitespace-nowrap"
              id="nav-about-link"
            >
              {t('navbar.theShop')}
            </a>
            <a
              href="#gallery"
              className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors whitespace-nowrap"
              id="nav-gallery-link"
            >
              {t('navbar.gallery')}
            </a>
            <a
              href="#hours"
              className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors whitespace-nowrap"
              id="nav-hours-link"
            >
              {t('navbar.hours')}
            </a>
            <a
              href="#barbers"
              className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors whitespace-nowrap"
              id="nav-barbers-link"
            >
              {t('navbar.barbers')}
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-sm px-2 py-1 shrink-0">
              <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-stone-400 mr-1 shrink-0" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-stone-300 text-xs font-medium uppercase tracking-wider focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">EN</option>
                <option value="de" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">DE</option>
                <option value="fr" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">FR</option>
              </select>
            </div>

            <button
              onClick={onBookClick}
              className="px-4 xl:px-5 py-2 bg-amber-600 text-black font-bold uppercase tracking-[0.15em] text-xs hover:bg-amber-500 transition-all rounded-sm active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-sm dark:shadow-none shrink-0 whitespace-nowrap"
              id="nav-book-now-button"
            >
              <Calendar className="w-3.5 h-3.5" />
              {t('navbar.reserve')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-sm px-2 py-1 mr-1">
              <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-stone-400" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-stone-300 text-xs font-medium uppercase tracking-wider focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">EN</option>
                <option value="de" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">DE</option>
                <option value="fr" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">FR</option>
              </select>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm text-zinc-800 dark:text-stone-200 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 focus:outline-none"
              id="mobile-menu-toggle-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#0C0C0C] border-b border-zinc-200 dark:border-stone-800 px-6 pt-4 pb-6 space-y-4 shadow-xl dark:shadow-2xl animate-in slide-in-from-top duration-200">
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-widest font-medium text-zinc-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 py-1"
          >
            {t('navbar.servicesPricing')}
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-widest font-medium text-zinc-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 py-1"
          >
            {t('navbar.shopHeritage')}
          </a>
          <a
            href="#gallery"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-widest font-medium text-zinc-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 py-1"
          >
            {t('navbar.gallery')}
          </a>
          <a
            href="#hours"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs uppercase tracking-widest font-medium text-zinc-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 py-1"
          >
            {t('navbar.hoursLocation')}
          </a>

          <div className="pt-4 border-t border-zinc-200 dark:border-stone-800 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookClick();
              }}
              className="w-full py-3 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm text-center"
            >
              {t('navbar.reserveChair')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};