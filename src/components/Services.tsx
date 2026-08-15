import React from 'react';
import { Clock, Calendar, Check, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Service, BusinessHour, BarbershopSettings, BlockedDate, Appointment, Barber } from '../types';
import { BARBERSHOP_IMAGES } from '../lib/images';
import { getSlotsRemainingToday } from '../lib/availability';

// 💰 Currency formatter — matches the one in BookingFlow.tsx. If this ever
// needs to change again, update it in both places (or better, move both to
// a shared src/lib/currency.ts and import it in each file).
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface ServicesProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  businessHours: BusinessHour[];
  settings: BarbershopSettings;
  blockedDates: BlockedDate[];
  existingAppointments: Appointment[];
  barbers: Barber[];
}

export const Services: React.FC<ServicesProps> = ({
  services,
  onSelectService,
  businessHours,
  settings,
  blockedDates,
  existingAppointments,
  barbers,
}) => {
  const { t, i18n } = useTranslation();

  // Filter active services only for public display
  const activeServices = services.filter((s) => s.is_active);

  // Helper function to get translated service name
  const getTranslatedServiceName = (service: Service): string => {
    // Try to get from serviceNames mapping first
    const translatedName = t(`serviceNames.${service.name}`, '');
    if (translatedName && translatedName !== `serviceNames.${service.name}`) {
      return translatedName;
    }
    // Fallback: try services section
    const serviceKey = service.name.toLowerCase().replace(/[ &]/g, '');
    const fallbackName = t(`services.${serviceKey}`, service.name);
    return fallbackName;
  };

  // Helper function to get translated service description
  const getTranslatedDescription = (service: Service): string => {
    // Try to get from serviceDescriptions mapping first
    const translatedDesc = t(`serviceDescriptions.${service.name}`, '');
    if (translatedDesc && translatedDesc !== `serviceDescriptions.${service.name}`) {
      return translatedDesc;
    }
    // Fallback: try services section
    const serviceKey = service.name.toLowerCase().replace(/[ &]/g, '') + 'Desc';
    const fallbackDesc = t(`services.${serviceKey}`, service.description);
    return fallbackDesc;
  };

  // Helper mapping for service images if image_url is missing
  const getServiceImage = (service: Service): string => {
    if (service.image_url) return service.image_url;
    const nameLower = service.name.toLowerCase();
    if (nameLower.includes('beard')) return BARBERSHOP_IMAGES.serviceBeard;
    if (nameLower.includes('shave')) return BARBERSHOP_IMAGES.serviceShave;
    if (nameLower.includes('fade')) return BARBERSHOP_IMAGES.serviceFade;
    if (nameLower.includes('package') || nameLower.includes('full') || nameLower.includes('crown')) return BARBERSHOP_IMAGES.servicePackage;
    return BARBERSHOP_IMAGES.serviceHaircut;
  };

  // Live slots-remaining-today count, computed from the real availability
  // engine (same generateAvailableSlots() logic the booking flow itself
  // uses) — never a fake/decorative number.
  const getSlotsToday = (service: Service): number => {
    try {
      return getSlotsRemainingToday({
        service,
        businessHours,
        settings,
        blockedDates,
        existingAppointments,
        barbers,
      });
    } catch (err) {
      // Fail silently to "unknown" rather than crash the page if data
      // shape is ever unexpected — badge just won't render for that card.
      console.warn('Could not compute slots remaining for service:', service.id, err);
      return -1;
    }
  };

  return (
    <section id="services" className="py-24 bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-stone-800 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="reveal max-w-3xl mb-16 space-y-3">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
            {t('services.eyebrow')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 dark:text-stone-100 tracking-tight">
            {t('services.title')}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-stone-400 font-normal max-w-xl leading-relaxed">
            {t('services.description')}
          </p>
        </div>

        {/* Services Grid */}
        {activeServices.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-stone-500 text-sm font-medium">
            {t('services.noServices')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeServices.map((service, i) => {
              const imageUrl = getServiceImage(service);
              const translatedName = getTranslatedServiceName(service);
              const translatedDesc = getTranslatedDescription(service);
              const slotsToday = getSlotsToday(service);
              const showBadge = slotsToday > 0;
              const isUrgent = slotsToday > 0 && slotsToday <= 2;
              
              return (
                <div
                  key={service.id}
                  className="reveal group rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 hover:border-amber-600/50 dark:hover:border-amber-600/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-md dark:shadow-xl"
                  style={{ transitionDelay: `${(i % 3) * 100}ms` }}
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-stone-900 border-b border-zinc-200 dark:border-stone-800">
                    <img
                      src={imageUrl}
                      alt={translatedName}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter contrast-105 grayscale-[0.2]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-[#0C0C0C] via-transparent to-transparent" />
                    
                    {/* Price Tag Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 dark:bg-[#0A0A0A]/90 border border-zinc-200 dark:border-stone-800 text-amber-600 dark:text-amber-500 font-serif font-bold text-base rounded-sm backdrop-blur-sm shadow-sm dark:shadow-none">
                      {formatPrice(service.price)}
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-700 dark:text-stone-300 bg-white/90 dark:bg-[#0A0A0A]/80 px-2.5 py-1 rounded-sm border border-zinc-200 dark:border-stone-800 backdrop-blur-sm shadow-sm dark:shadow-none">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                      {service.duration_minutes} {t('services.mins')}
                    </div>

                    {/* Live Slots-Today Badge — only renders when there is genuine
                        remaining availability today, computed from the real
                        booking engine, so it never overstates or fabricates urgency. */}
                    {showBadge && (
                      <div
                        className={`absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-sm border backdrop-blur-sm shadow-sm dark:shadow-none ${
                          isUrgent
                            ? 'bg-red-600/95 text-white border-red-700'
                            : 'bg-emerald-600/90 text-white border-emerald-700'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        {t('services.slotsToday', '{{count}} left today', { count: slotsToday })}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-zinc-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                        {translatedName}
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-stone-400 mt-2 font-normal leading-relaxed line-clamp-3">
                        {translatedDesc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-stone-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-zinc-600 dark:text-stone-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                        <span>{t('services.hotTowelIncluded')}</span>
                      </div>

                      <button
                        onClick={() => onSelectService(service)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-[0.2em] text-[10px] transition-all rounded-sm cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm dark:shadow-none"
                        id={`select-service-${service.id}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {t('services.reserve')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};