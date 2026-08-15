import React from 'react';
import { ShieldCheck, Award, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BARBERSHOP_IMAGES } from '../lib/images';
import { BarbershopSettings, BusinessHour } from '../types';

interface AboutProps {
  settings: BarbershopSettings;
  businessHours: BusinessHour[];
}

export const About: React.FC<AboutProps> = ({ settings, businessHours }) => {
  const { t, i18n } = useTranslation();

  const weekdayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ];

  // Get translated barber data
  const getTranslatedBarbers = () => {
    const lang = i18n.language;
    
    // Map barber data from images.ts with translations
    const barberData = BARBERSHOP_IMAGES.barbers.map((barber, index) => {
      // Get the barber key based on index or name
      let barberKey = '';
      if (barber.name.includes('Mireya')) barberKey = 'mireya';
      else if (barber.name.includes('Dominic')) barberKey = 'dominic';
      else if (barber.name.includes('Leo')) barberKey = 'leo';
      else barberKey = `barber${index}`;

      // Try to get translated data from barbers section
      const translatedName = t(`barbers.${barberKey}.name`, barber.name);
      const translatedRole = t(`barbers.${barberKey}.title`, barber.role);
      const translatedSpecialty = t(`barbers.${barberKey}.specialty`, barber.specialty);

      return {
        ...barber,
        name: translatedName,
        role: translatedRole,
        specialty: translatedSpecialty
      };
    });

    return barberData;
  };

  const translatedBarbers = getTranslatedBarbers();

  return (
    <section id="about" className="py-24 bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-stone-800 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Heritage & Craftsmanship Section */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-24">
          
          {/* Left Collage Visuals */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-stone-800 shadow-md dark:shadow-xl h-64 bg-white dark:bg-[#0C0C0C]">
                  <img
                    src={BARBERSHOP_IMAGES.aboutMain}
                    alt="Master Barber Straight Razor Shave"
                    className="w-full h-full object-cover filter contrast-110 grayscale-[0.2]"
                  />
                </div>
                <div className="rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-6 text-center space-y-1 shadow-sm dark:shadow-none">
                  <span className="text-3xl font-serif font-bold text-amber-600 dark:text-amber-500">10k+</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-stone-400 font-medium">
                    {t('about.gentlemenServed')}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-6 text-center space-y-1 shadow-sm dark:shadow-none">
                  <span className="text-3xl font-serif font-bold text-amber-600 dark:text-amber-500">100%</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-stone-400 font-medium">
                    {t('about.satisfactionGuaranteed')}
                  </p>
                </div>
                <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-stone-800 shadow-md dark:shadow-xl h-64 bg-white dark:bg-[#0C0C0C]">
                  <img
                    src={BARBERSHOP_IMAGES.aboutCraft}
                    alt="Barber Precision Craftsmanship"
                    className="w-full h-full object-cover filter contrast-110 grayscale-[0.2]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
              <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
              {t('about.eyebrowStandard')}
            </div>

            <h2 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 dark:text-stone-100 leading-tight">
              {t('about.titleStandard')}
            </h2>

            <p className="text-sm text-zinc-600 dark:text-stone-400 font-normal leading-relaxed">
              {t('about.descStandard', { shopName: settings.barbershop_name || t('about.defaultShopName') })}
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-sm bg-amber-600/10 border border-amber-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-stone-200 uppercase tracking-wider">{t('about.consultationTitle')}</h4>
                  <p className="text-xs text-zinc-600 dark:text-stone-400 mt-0.5">{t('about.consultationDesc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-sm bg-amber-600/10 border border-amber-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-stone-200 uppercase tracking-wider">{t('about.espressoTitle')}</h4>
                  <p className="text-xs text-zinc-600 dark:text-stone-400 mt-0.5">{t('about.espressoDesc')}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Master Barbers Section */}
        <div id="barbers" className="mb-24 pt-16 border-t border-zinc-200 dark:border-stone-800">
          <div className="max-w-2xl mb-12 space-y-2">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
              <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
              {t('about.eyebrowArtisans')}
            </div>
            <h3 className="text-3xl sm:text-4xl font-serif font-light text-zinc-900 dark:text-stone-100">
              {t('about.titleBarbers')}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-stone-400 font-normal">
              {t('about.descBarbers')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {translatedBarbers.map((barber, i) => (
              <div
                key={i}
                className="rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 overflow-hidden group hover:border-amber-600/50 dark:hover:border-amber-600/40 transition-all duration-300 shadow-md dark:shadow-xl"
              >
                <div className="h-72 overflow-hidden relative bg-zinc-100 dark:bg-stone-900 border-b border-zinc-200 dark:border-stone-800">
                  <img
                    src={barber.image}
                    alt={barber.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 filter contrast-105 grayscale-[0.2]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 dark:from-[#0C0C0C] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-sm bg-white/90 dark:bg-[#0A0A0A]/90 border border-zinc-200 dark:border-stone-800 text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm dark:shadow-none">
                    {barber.experience}
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h4 className="text-lg font-serif font-bold text-zinc-900 dark:text-stone-100">{barber.name}</h4>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">{barber.role}</p>
                  <p className="text-xs text-zinc-600 dark:text-stone-400 pt-2 border-t border-zinc-200 dark:border-stone-800/80">
                    <span className="font-semibold text-zinc-800 dark:text-stone-300">{t('about.specialty')}:</span> {barber.specialty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours & Location Section */}
        <div id="hours" className="rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-8 lg:p-12 shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Business Hours List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-stone-100">{t('about.workingHoursTitle')}</h3>
                  <p className="text-xs text-zinc-600 dark:text-stone-400">{t('about.workingHoursDesc')}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {weekdayKeys.map((dayKey, idx) => {
                  const hour = businessHours.find((h) => h.weekday === idx);
                  const isOpen = hour ? hour.is_open : true;
                  return (
                    <div
                      key={dayKey}
                      className={`flex items-center justify-between p-3 rounded-sm border text-xs ${
                        isOpen
                          ? 'bg-zinc-50 dark:bg-[#0A0A0A] border-zinc-200 dark:border-stone-800 text-zinc-800 dark:text-stone-200'
                          : 'bg-zinc-100/60 dark:bg-[#0A0A0A]/40 border-zinc-200/60 dark:border-stone-800/50 text-zinc-400 dark:text-stone-600'
                      }`}
                    >
                      <span className="font-medium">{t(`about.days.${dayKey}`)}</span>
                      <span className={isOpen ? 'text-amber-600 dark:text-amber-500 font-bold font-mono' : 'text-zinc-400 dark:text-stone-600'}>
                        {isOpen && hour ? `${hour.start_time} - ${hour.end_time}` : t('about.closed')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address & Contact Box */}
            <div className="lg:col-span-5 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 p-6 space-y-6">
              <h4 className="text-lg font-serif font-bold text-zinc-900 dark:text-stone-100 uppercase tracking-wider">{t('about.studioLocationTitle')}</h4>

              <div className="space-y-4 text-xs text-zinc-700 dark:text-stone-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-stone-100 block uppercase tracking-wider text-[10px]">{t('about.addressLabel')}</span>
                    <span className="text-zinc-600 dark:text-stone-300">{settings.barbershop_address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-stone-100 block uppercase tracking-wider text-[10px]">{t('about.phoneLabel')}</span>
                    <a href={`tel:${settings.barbershop_phone}`} className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                      {settings.barbershop_phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-stone-100 block uppercase tracking-wider text-[10px]">{t('about.emailLabel')}</span>
                    <a href={`mailto:${settings.barbershop_email}`} className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                      {settings.barbershop_email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-stone-800 text-[11px] text-zinc-500 dark:text-stone-500">
                {t('about.parkingNote')}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};