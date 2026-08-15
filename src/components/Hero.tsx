import React from 'react';
import { Calendar, Scissors, Award, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BARBERSHOP_IMAGES } from '../lib/images';
import { BarbershopSettings } from '../types';

interface HeroProps {
  settings: BarbershopSettings;
  onBookClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onBookClick }) => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] pt-24 pb-16 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-stone-100 border-b border-zinc-200 dark:border-stone-800 transition-colors duration-300">
      {/* Background Image with Geometric Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={BARBERSHOP_IMAGES.heroBg}
          alt="Barber Shop Interior"
          className="w-full h-full object-cover opacity-15 dark:opacity-40 grayscale-[0.3] filter contrast-125 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-zinc-50/80 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-transparent transition-colors duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent dark:from-[#0A0A0A] dark:via-transparent dark:to-transparent transition-colors duration-300" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Copy & CTA */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Geometric Eyebrow */}
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
              <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
              {t('hero.eyebrow')}
            </div>

            {/* Serif Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-light text-zinc-900 dark:text-stone-100 leading-tight">
              {t('hero.headlineMain')} <br />
              <span className="italic text-amber-600 dark:text-amber-500">{t('hero.headlineSub')}</span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="max-w-xl text-zinc-600 dark:text-stone-400 leading-relaxed text-sm font-normal">
              {settings.barbershop_name || t('hero.defaultName')} {t('hero.description')}
            </p>

            {/* Location & Contact Grid */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-stone-500 uppercase tracking-widest mb-1">
                  {t('hero.studioAddress')}
                </span>
                <span className="text-zinc-800 dark:text-stone-200 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  {settings.barbershop_address || t('hero.defaultAddress')}
                </span>
              </div>

              <div className="w-[1px] h-10 bg-zinc-200 dark:bg-stone-800 hidden sm:block"></div>

              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-stone-500 uppercase tracking-widest mb-1">
                  {t('hero.directLine')}
                </span>
                <span className="text-zinc-800 dark:text-stone-200 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  {settings.barbershop_phone || '+44 (20) 7946 0128'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={onBookClick}
                className="px-8 py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-md dark:shadow-none"
                id="hero-reserve-chair-button"
              >
                <Calendar className="w-4 h-4" />
                {t('hero.reserveChair')}
              </button>

              <a
                href="#services"
                className="px-6 py-3.5 border border-zinc-300 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:border-amber-600 dark:hover:border-amber-600/40 hover:text-amber-600 dark:hover:text-amber-500 transition-all text-xs uppercase tracking-widest font-medium rounded-sm text-center bg-white/50 dark:bg-transparent"
                id="hero-view-services-button"
              >
                {t('hero.viewServices')}
              </a>
            </div>

            {/* Geometric Highlights Bar */}
            <div className="pt-6 border-t border-zinc-200 dark:border-stone-800 grid grid-cols-3 gap-4 text-xs text-zinc-600 dark:text-stone-400">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="text-[11px]">{t('hero.masterBarbers')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="text-[11px]">{t('hero.hotTowelShaves')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="text-[11px]">{t('hero.instantConfirmation')}</span>
              </div>
            </div>

          </div>

          {/* Right Column - Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Geometric Frame */}
              <div className="relative rounded-sm overflow-hidden border border-zinc-200 dark:border-stone-800 bg-white dark:bg-[#0C0C0C] p-2 shadow-xl dark:shadow-2xl transition-colors duration-300">
                <div className="relative h-[420px] overflow-hidden rounded-sm">
                  <img
                    src={BARBERSHOP_IMAGES.heroOverlay}
                    alt="Barber Precision Haircut"
                    className="w-full h-full object-cover object-top filter contrast-110 grayscale-[0.2]"
                  />
                  
                  {/* Subtle Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 dark:from-[#0A0A0A] via-transparent to-transparent opacity-90" />
                </div>

                {/* Floating Geometric Quote Card */}
                <div className="p-4 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 rounded-sm mt-2 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm overflow-hidden border border-amber-600/40 shrink-0">
                      <img
                        src={BARBERSHOP_IMAGES.barbers[0].image}
                        alt="Mireya Thorne"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-stone-200">Mireya Thorne</h4>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 uppercase tracking-widest">{t('hero.headMasterBarber')}</p>
                      <p className="text-[11px] text-zinc-600 dark:text-stone-400 italic mt-0.5 font-serif leading-snug">
                        {t('hero.barberQuote')}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};