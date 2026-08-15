import React from 'react';
import { Scissors, MapPin, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarbershopSettings } from '../types';

interface FooterProps {
  settings: BarbershopSettings;
  onAdminClick: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const { t } = useTranslation();

  return (
    <footer className="bg-zinc-100 dark:bg-[#050505] border-t border-zinc-200 dark:border-stone-800 text-zinc-600 dark:text-stone-400 text-xs pt-16 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-amber-600 flex items-center justify-center shadow-sm">
                <Scissors className="w-5 h-5 text-black transform -rotate-45" />
              </div>
              <div>
                <span className="block text-lg font-serif font-light tracking-[0.2em] text-zinc-900 dark:text-stone-100 uppercase">
                  {settings.barbershop_name || t('footer.default_name', 'CROWN & CUT')}
                </span>
                <span className="block text-[9px] tracking-[0.3em] text-amber-600 dark:text-amber-500 font-bold uppercase -mt-0.5">
                  {t('footer.subtitle', 'FINE GROOMING STUDIO')}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-stone-400 leading-relaxed max-w-sm">
              {t(
                'footer.description',
                'Dedicated to precision haircutting, classic straight razor shaves, and executive beard grooming. Traditional barber craftsmanship elevated for today.'
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-stone-200 uppercase tracking-[0.2em]">
              {t('footer.navigation_title', 'Navigation')}
            </h4>
            <ul className="space-y-2.5 text-zinc-600 dark:text-stone-400 text-xs">
              <li>
                <a href="#services" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                  {t('footer.nav_services', 'Services & Pricing')}
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                  {t('footer.nav_about', 'Our Craft & Heritage')}
                </a>
              </li>
              <li>
                <a href="#barbers" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                  {t('footer.nav_barbers', 'Master Barbers')}
                </a>
              </li>
              <li>
                <a href="#hours" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                  {t('footer.nav_hours', 'Hours & Studio Location')}
                </a>
              </li>
              <li>
                <a href="#booking" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                  {t('footer.nav_booking', 'Reserve Chair Online')}
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  {t('footer.nav_privacy', 'Privacy Policy')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-stone-200 uppercase tracking-[0.2em]">
              {t('footer.studio_details_title', 'Studio Details')}
            </h4>
            <div className="space-y-3 text-zinc-600 dark:text-stone-400 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <span>{settings.barbershop_address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>{settings.barbershop_phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>{settings.barbershop_email}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-zinc-200 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-stone-500">
          <p>
            © {new Date().getFullYear()} {settings.barbershop_name}.{' '}
            {t('footer.rights_reserved', 'All rights reserved.')}
            {' · '}
            <a
              href="#privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 dark:hover:text-amber-500 underline transition-colors"
            >
              {t('footer.nav_privacy', 'Privacy Policy')}
            </a>
          </p>
          <p className="flex items-center gap-1 uppercase tracking-widest text-[9px] text-zinc-500 dark:text-stone-500">
            {t('footer.tagline', 'Geometric Balance • Fine Craftsmanship')}
          </p>
        </div>
      </div>
    </footer>
  );
};