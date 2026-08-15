import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
// ✅ FIXED: Import locales properly for Vite
import de from 'date-fns/locale/de';
import en from 'date-fns/locale/en-US';
import fr from 'date-fns/locale/fr';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scissors,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Service, BusinessHour, BlockedDate, BarbershopSettings, Appointment, TimeSlot, Barber } from '../types';
import { generateAvailableSlots, getShopNow } from '../lib/availability';
import { supabase, isSupabaseConnected } from '../lib/supabase';
// 👇 Loyalty imports
import {
  CustomerProfile,
  LoyaltySettings,
  getOrCreateCustomerProfile,
  getLoyaltySettings,
  getAvailableDiscount
} from '../lib/loyalty';

// 💰 Currency formatter — single source of truth for how prices render
// across the entire booking flow. Change here once if currency/locale
// formatting ever needs to change again.
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface BookingFlowProps {
  services: Service[];
  barbers: Barber[];
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  settings: BarbershopSettings;
  existingAppointments: Appointment[];
  preselectedService?: Service | null;
  onBookingSuccess: (newAppointment: Appointment) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => string;
  onRequestRefresh?: () => void;
  // 👇 Callback for customer info changes
  onCustomerInfoChange?: (email: string, name: string, phone: string) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  barbers,
  businessHours,
  blockedDates,
  settings,
  existingAppointments,
  preselectedService,
  onBookingSuccess,
  addToast,
  onRequestRefresh,
  onCustomerInfoChange,
}) => {
  const { t, i18n } = useTranslation();

  // 👇 Get current locale for date formatting
  const currentLocale = {
    de: de,
    en: en,
    fr: fr
  }[i18n.language] || en;

  // 👇 Helper function to get translated service name
  const getTranslatedServiceName = (service: Service): string => {
    if (!service) return '';
    return t(`serviceNames.${service.name}`, service.name);
  };

  const activeServices = services.filter((s) => s.is_active);

  // Steps: 1 = Service, 2 = Date & Time, 3 = Client Details, 4 = Confirmation
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(
    preselectedService || activeServices[0] || null
  );

  // Date selection (default to today, anchored to the shop's Geneva timezone —
  // not the visitor's own device timezone)
  const todayStr = format(getShopNow(), 'yyyy-MM-dd');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  // Generated time slots
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 🆕 Privacy Policy consent — required before a booking can be submitted.
  // Reset on handleReset() so a subsequent booking (via "Book Another")
  // starts unconsented again rather than silently carrying it over.
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // 👇 Loyalty state
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [applyDiscount, setApplyDiscount] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');

  // Load loyalty settings once
  useEffect(() => {
    getLoyaltySettings().then(setLoyaltySettings);
  }, []);

  // Update selected service if preselectedService changes from parent
  useEffect(() => {
    if (preselectedService) {
      setSelectedService(preselectedService);
    }
  }, [preselectedService]);

  // Recalculate available slots
  useEffect(() => {
    if (!selectedService || !selectedDateStr) {
      setAvailableSlots([]);
      return;
    }

    const slots = generateAvailableSlots({
      selectedDateStr,
      serviceDurationMinutes: selectedService.duration_minutes,
      businessHours,
      settings,
      blockedDates,
      existingAppointments,
      selectedBarberId,
      barbers,
    });

    setAvailableSlots(slots);
    setSelectedSlot(null);
  }, [selectedService, selectedDateStr, businessHours, settings, blockedDates, existingAppointments, selectedBarberId, barbers]);

  // 👇 Load customer profile when email is entered in step 3
  useEffect(() => {
    if (step !== 3 || !email || !fullName) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    const timer = setTimeout(loadCustomerProfile, 600);
    return () => clearTimeout(timer);
  }, [step, email, fullName]);

  // 👇 Notify parent when customer info changes
  useEffect(() => {
    if (onCustomerInfoChange) {
      onCustomerInfoChange(email, fullName, phone);
    }
  }, [email, fullName, phone, onCustomerInfoChange]);

  const loadCustomerProfile = async () => {
    if (!email || !fullName) return;
    try {
      const profile = await getOrCreateCustomerProfile(email, fullName, phone);
      if (profile) {
        setCustomerProfile(profile);
      }
    } catch (error) {
      console.error('Error loading customer profile:', error);
    }
  };

  // Generate next 14 days list
  const upcomingDays = Array.from({ length: 14 }).map((_, index) => {
    const d = addDays(getShopNow(), index);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEE', { locale: currentLocale });
    const dayNum = format(d, 'd');
    const monthName = format(d, 'MMM', { locale: currentLocale });
    const isBlocked = blockedDates.some((b) => b.blocked_date === dateStr);

    const weekday = d.getDay();
    const bh = businessHours.find((h) => h.weekday === weekday);
    const isOpen = bh ? bh.is_open : true;

    return { dateStr, dayName, dayNum, monthName, isBlocked, isOpen };
  });

  // 👇 handleCreateBooking with loyalty integration
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot || !fullName || !email || !phone) {
      setErrorMsg(t('booking.step3.errRequired'));
      return;
    }

    // 🆕 Consent gate — enforced here (not just via the disabled submit
    // button) because pressing Enter inside a text field submits the <form>
    // directly and bypasses a disabled button's click handler.
    if (!consentGiven) {
      setErrorMsg(
        t('booking.step3.errConsentRequired', 'Please confirm you agree to the Privacy Policy to continue.')
      );
      return;
    }

    if (!selectedService.id) {
      setErrorMsg('Service error: service ID is missing');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    let finalDiscount = 0;
    let pointsRedeemed = 0;

    if (applyDiscount && customerProfile) {
      const settingsData = await getLoyaltySettings();
      if (settingsData) {
        const { eligible, discountAmount: amt, pointsRequired } = getAvailableDiscount(customerProfile, settingsData);
        if (eligible) {
          finalDiscount = Math.min(amt, selectedService.price);
          pointsRedeemed = pointsRequired;
        }
      }
    }

    let customerId = customerProfile?.id;
    if (!customerId && email && fullName) {
      try {
        const profile = await getOrCreateCustomerProfile(email, fullName, phone);
        if (profile) {
          customerId = profile.id;
          setCustomerProfile(profile);
        }
      } catch (error) {
        console.error('Error creating customer profile:', error);
      }
    }

    const newAppointmentPayload = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service_id: selectedService.id,
      barber_id: selectedBarberId || selectedSlot.matchedBarberId || null,
      appointment_date: selectedDateStr,
      start_time: selectedSlot.startTimeString,
      end_time: selectedSlot.endTimeString,
      status: 'pending' as const,
      notes: notes.trim() || null,
      lang: i18n.language,
      customer_id: customerId || null,
      discount_amount: finalDiscount,
      points_redeemed: pointsRedeemed,
      referral_code_used: referralCode.trim() || null,
    };

    try {
      if (isSupabaseConnected()) {
        const { data, error } = await supabase
          .from('appointments')
          .insert([newAppointmentPayload])
          .select('*, service:services(*), barber:barbers(*)')
          .single();

        if (error) {
          console.error('Booking error details:', error);

          if (error.code === '23P01') {
            if (onRequestRefresh) {
              onRequestRefresh();
            }
            if (addToast) {
              addToast(
                '⏱️ That time slot was just taken by another booking. Please pick a different time.',
                'error',
                6000
              );
            }
            setStep(2);
            setSubmitting(false);
            return;
          }

          throw new Error(`Failed to create booking: ${error.message}`);
        }

        // Use the SERVER-computed values from the trigger
        const booked: Appointment = {
          ...data,
          service: data.service || selectedService,
          barber: data.barber || (selectedBarberId ? barbers.find((b) => b.id === selectedBarberId) || null : null),
        };

        // ✅ Use server-computed values
        const serverDiscount = booked.discount_amount ?? 0;
        const serverPointsEarned = booked.points_earned ?? 0;
        const servicePrice = booked.service?.price || selectedService.price || 0;
        const finalTotal = servicePrice - serverDiscount;

        // ✅ DEBUG: Log the values
        console.log('📧 Booking confirmed with:', {
          servicePrice,
          serverDiscount,
          finalTotal,
          serverPointsEarned
        });

        // Trigger Edge Function to send booking confirmation emails
        try {
          const selectedBarberName = selectedBarberId
            ? barbers.find((b) => b.id === selectedBarberId)?.full_name
            : null;

          const emailPayload = {
            customerEmail: booked.email,
            adminEmail: settings.barbershop_email,
            customerName: booked.full_name,
            customerPhone: booked.phone,
            serviceName: booked.service?.name || selectedService.name || 'Unknown Service',
            servicePrice: servicePrice,
            discountAmount: serverDiscount,
            pointsEarned: serverPointsEarned,
            date: booked.appointment_date,
            time: `${booked.start_time} - ${booked.end_time}`,
            notes: booked.notes || '',
            address: settings.barbershop_address || '',
            barberName: selectedBarberName || '',
            lang: i18n.language || 'en',
            appointmentId: booked.id,
            siteUrl: window.location.origin || 'http://localhost:3000',
          };

          console.log('📧 Final email payload:', emailPayload);

          const { error: emailError } = await supabase.functions.invoke('send-booking-email', {
            body: emailPayload,
          });

          if (emailError) {
            console.error('❌ Email function error:', emailError);
          } else {
            console.log('✅ Email function invoked successfully');
          }
        } catch (emailErr) {
          console.error('❌ Failed to trigger send-booking-email edge function:', emailErr);
        }

        setCreatedAppointment(booked);
        onBookingSuccess(booked);

        if (addToast) {
          const discountMsg = serverDiscount > 0 ? ` ${formatPrice(serverDiscount)} discount applied!` : '';
          addToast(
            `🎉 Booking confirmed!${discountMsg} Check your email at ${booked.email} for confirmation.`,
            'success',
            7000
          );
        }

        setStep(4);
      } else {
        // Fallback for unconfigured mode
        const selectedBarberObj = selectedBarberId ? barbers.find((barber) => barber.id === selectedBarberId) : null;
        const fallbackApp: Appointment = {
          id: 'app-' + Date.now(),
          full_name: newAppointmentPayload.full_name,
          email: newAppointmentPayload.email,
          phone: newAppointmentPayload.phone,
          service_id: newAppointmentPayload.service_id,
          barber_id: newAppointmentPayload.barber_id,
          appointment_date: newAppointmentPayload.appointment_date,
          start_time: newAppointmentPayload.start_time,
          end_time: newAppointmentPayload.end_time,
          status: newAppointmentPayload.status,
          notes: newAppointmentPayload.notes,
          created_at: new Date().toISOString(),
          service: selectedService,
          barber: selectedBarberObj || null,
          discount_amount: finalDiscount,
          points_redeemed: pointsRedeemed,
          customer_id: customerId || undefined,
        };
        setCreatedAppointment(fallbackApp);
        onBookingSuccess(fallbackApp);

        if (addToast) {
          const discountMsg = finalDiscount > 0 ? ` ${formatPrice(finalDiscount)} discount applied!` : '';
          addToast(
            `✅ Booking saved!${discountMsg} Confirmation sent to ${fallbackApp.email}`,
            'success',
            7000
          );
        }

        setStep(4);
      }
    } catch (err: any) {
      console.error('Error submitting appointment:', err);
      const errorMsg = err.message || t('booking.step3.errSubmitFailed');
      setErrorMsg(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSlot(null);
    setSelectedBarberId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setCreatedAppointment(null);
    setCustomerProfile(null);
    setApplyDiscount(false);
    setDiscountAmount(0);
    setReferralCode('');
    setConsentGiven(false); // 🆕 require fresh consent for the next booking
  };

  return (
    <section id="booking" className="py-24 bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-stone-800 relative transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Title */}
        <div className="max-w-2xl mx-auto text-center mb-12 space-y-3">
          <div className="flex items-center justify-center gap-3 text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
            {t('booking.sectionSub')}
            <span className="h-[1px] w-8 bg-amber-600 dark:bg-amber-500"></span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-light text-zinc-900 dark:text-stone-100">
            {t('booking.sectionTitle')}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-stone-400 font-normal">
            {t('booking.sectionDesc')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-zinc-200 dark:bg-stone-800 -z-0" />

            {[
              { num: 1, label: t('booking.steps.service') },
              { num: 2, label: t('booking.steps.dateTime') },
              { num: 3, label: t('booking.steps.yourInfo') },
              { num: 4, label: t('booking.steps.confirmed') },
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-sm flex items-center justify-center font-bold text-xs transition-all ${isPassed
                      ? 'bg-amber-600 text-black'
                      : isCurrent
                        ? 'bg-amber-600 text-black ring-4 ring-amber-600/20 font-bold'
                        : 'bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 text-zinc-400 dark:text-stone-500 shadow-sm dark:shadow-none'
                      }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4 text-black" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider mt-2 hidden sm:block ${isCurrent ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-zinc-500 dark:text-stone-500'
                      }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card Wrapper */}
        <div className="rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-6 sm:p-10 shadow-xl dark:shadow-2xl relative transition-colors duration-300">

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-zinc-200 dark:border-stone-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-stone-100">{t('booking.step1.title')}</h3>
                  <p className="text-xs text-zinc-600 dark:text-stone-400">{t('booking.step1.subtitle')}</p>
                </div>
                {selectedService && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-600/10 px-3 py-1 rounded-sm border border-amber-600/30 uppercase tracking-widest">
                    {t('booking.step1.selectedLabel', { name: getTranslatedServiceName(selectedService) })}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {activeServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-5 rounded-sm border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                        ? 'bg-amber-600/5 border-amber-600/60 ring-1 ring-amber-600/40 shadow-lg'
                        : 'bg-zinc-50 dark:bg-[#0A0A0A] border-zinc-200 dark:border-stone-800 hover:border-zinc-300 dark:hover:border-stone-700'
                        }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-stone-100">
                            {getTranslatedServiceName(service)}
                          </h4>
                          <span className="text-base font-serif font-bold text-amber-600 dark:text-amber-500 shrink-0">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-stone-400 line-clamp-2">
                          {t(`serviceDescriptions.${service.name}`, service.description)}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-stone-800/80 flex items-center justify-between text-xs text-amber-600 dark:text-amber-500">
                        <span className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                          {t('booking.step1.mins', { count: service.duration_minutes })}
                        </span>

                        <div className="flex items-center gap-1 font-bold uppercase tracking-widest text-[10px]">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> {t('booking.step1.selected')}
                            </span>
                          ) : (
                            <span className="text-zinc-500 dark:text-stone-500 hover:text-zinc-800 dark:hover:text-stone-200">
                              {t('booking.step1.select')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm dark:shadow-none"
                  id="step-1-continue-btn"
                >
                  {t('booking.step1.btnContinue')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & TIME SLOT */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-zinc-200 dark:border-stone-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-stone-100">{t('booking.step2.title')}</h3>
                  <p className="text-xs text-zinc-600 dark:text-stone-400">
                    <Trans
                      i18nKey="booking.step2.selectedService"
                      values={{
                        name: selectedService ? getTranslatedServiceName(selectedService) : '',
                        duration: selectedService?.duration_minutes,
                      }}
                      components={{
                        1: <span className="text-amber-600 dark:text-amber-500 font-semibold" />,
                      }}
                    />
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('booking.step2.changeService')}
                </button>
              </div>

              {/* Barber selection */}
              <div className="rounded-sm border border-zinc-200 dark:border-stone-800 bg-zinc-50 dark:bg-[#0A0A0A] p-4">
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-3">
                  {t('booking.step2.chooseBarber')}
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBarberId(null)}
                    className={`rounded-sm border px-3 py-2 text-sm transition-all ${selectedBarberId === null
                      ? 'border-amber-600 dark:border-amber-500 bg-amber-600/10 text-amber-700 dark:text-amber-400 font-medium'
                      : 'border-zinc-200 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:border-zinc-300 dark:hover:border-stone-700 bg-white dark:bg-[#0C0C0C]'
                      }`}
                  >
                    {t('booking.step2.anyBarber')}
                  </button>
                  {barbers.filter((barber) => barber.is_active).map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => setSelectedBarberId(barber.id)}
                      className={`rounded-sm border px-3 py-2 text-sm text-left transition-all ${selectedBarberId === barber.id
                        ? 'border-amber-600 dark:border-amber-500 bg-amber-600/10 text-amber-700 dark:text-amber-400 font-medium'
                        : 'border-zinc-200 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:border-zinc-300 dark:hover:border-stone-700 bg-white dark:bg-[#0C0C0C]'
                        }`}
                    >
                      <div className="font-semibold">{barber.full_name}</div>
                      {barber.role && (
                        <div className="text-[10px] text-zinc-500 dark:text-stone-500">
                          {t('booking.step2.barberRole')}: {barber.role}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">
                  {t('booking.step2.selectDateLabel')}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-700">
                  {upcomingDays.map((day) => {
                    const isSelected = selectedDateStr === day.dateStr;
                    const isDisabled = day.isBlocked || !day.isOpen;

                    return (
                      <button
                        key={day.dateStr}
                        disabled={isDisabled}
                        onClick={() => setSelectedDateStr(day.dateStr)}
                        className={`flex flex-col items-center justify-center p-3 min-w-[72px] rounded-sm border transition-all shrink-0 cursor-pointer ${isSelected
                          ? 'bg-amber-600 border-amber-600 dark:border-amber-500 text-black font-bold shadow-md'
                          : isDisabled
                            ? 'bg-zinc-100/50 dark:bg-[#0A0A0A]/40 border-zinc-200/50 dark:border-stone-800/50 text-zinc-400 dark:text-stone-600 cursor-not-allowed opacity-50'
                            : 'bg-zinc-50 dark:bg-[#0A0A0A] border-zinc-200 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:border-zinc-300 dark:hover:border-stone-700'
                          }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider font-medium">{day.dayName}</span>
                        <span className="text-lg font-serif font-bold my-0.5">{day.dayNum}</span>
                        <span className="text-[9px] uppercase font-medium">{day.monthName}</span>
                        {isDisabled && (
                          <span className="text-[8px] text-red-500 dark:text-red-400 font-bold mt-0.5">
                            {t('booking.step2.closed')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">
                    {t('booking.step2.slotsLabel', {
                      date: format(new Date(selectedDateStr + 'T00:00:00'), 'EEEE, MMMM d, yyyy', { locale: currentLocale })
                    })}
                  </label>
                  <span className="text-xs text-zinc-500 dark:text-stone-500">
                    {t('booking.step2.slotsCount', {
                      count: availableSlots.filter((s) => s.isAvailable).length
                    })}
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="p-8 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-500 mx-auto opacity-60" />
                    <p className="text-sm text-zinc-800 dark:text-stone-200 font-semibold">{t('booking.step2.noSlotsTitle')}</p>
                    <p className="text-xs text-zinc-600 dark:text-stone-400">
                      {t('booking.step2.noSlotsDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                    {availableSlots.map((slot, i) => {
                      const isSelected = selectedSlot?.startTimeString === slot.startTimeString;
                      return (
                        <button
                          key={i}
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-sm border text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${isSelected
                            ? 'bg-amber-600/10 border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 ring-1 ring-amber-600 dark:ring-amber-500 font-bold'
                            : slot.isAvailable
                              ? 'bg-zinc-50 dark:bg-[#0A0A0A] border-zinc-200 dark:border-stone-800 text-zinc-800 dark:text-stone-200 hover:border-amber-600/40 hover:text-amber-600 dark:hover:text-amber-500'
                              : 'bg-zinc-100/50 dark:bg-[#0A0A0A]/40 border-zinc-200/40 dark:border-stone-800/40 text-zinc-400 dark:text-stone-600 line-through cursor-not-allowed'
                            }`}
                        >
                          <span className="text-xs font-bold font-mono">{slot.label}</span>
                          {!slot.isAvailable && slot.reason && (
                            <span className="text-[9px] text-red-500 dark:text-red-400/80 font-normal">
                              {t(`booking.step2.reasons.${slot.reason}`, slot.reason)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-zinc-200 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:text-zinc-900 dark:hover:text-stone-100 font-medium text-xs uppercase tracking-widest cursor-pointer transition-colors"
                >
                  {t('booking.step2.btnBack')}
                </button>

                <button
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="px-8 py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm dark:shadow-none"
                  id="step-2-continue-btn"
                >
                  {t('booking.step2.btnContinue')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT DETAILS FORM */}
          {step === 3 && (
            <form onSubmit={handleCreateBooking} className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-zinc-200 dark:border-stone-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-stone-100">{t('booking.step3.title')}</h3>
                  <p className="text-xs text-zinc-600 dark:text-stone-400">{t('booking.step3.subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('booking.step3.changeTime')}
                </button>
              </div>

              {/* Booking Summary Mini Box */}
              <div className="p-4 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <span className="font-serif font-bold text-zinc-900 dark:text-stone-100 text-sm block">
                      {selectedService ? getTranslatedServiceName(selectedService) : ''}
                    </span>
                    <span className="text-zinc-600 dark:text-stone-400 text-[11px]">
                      {format(new Date(selectedDateStr + 'T00:00:00'), 'EEEE, MMM d, yyyy', { locale: currentLocale })} @ {selectedSlot?.label}
                    </span>
                    <span className="text-zinc-600 dark:text-stone-400 text-[11px] block">
                      {selectedBarberId
                        ? (barbers.find((barber) => barber.id === selectedBarberId)?.full_name || 'Selected barber')
                        : t('booking.step2.anyBarber')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 dark:text-stone-500 uppercase tracking-widest block">
                    {t('booking.step3.totalDue')}
                  </span>
                  {applyDiscount && discountAmount > 0 ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-serif text-zinc-400 dark:text-stone-600 line-through">
                        {formatPrice(selectedService?.price || 0)}
                      </span>
                      <span className="text-lg font-serif font-bold text-green-600 dark:text-green-400">
                        {formatPrice(Number(selectedService?.price || 0) - discountAmount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-serif font-bold text-amber-600 dark:text-amber-500">
                      {formatPrice(selectedService?.price || 0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Loyalty Discount Section */}
              {customerProfile && customerProfile.total_points > 0 && (
                <div className="p-4 rounded-sm bg-amber-600/5 border border-amber-600/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-stone-100">
                        {t('booking.step3.loyaltyDiscount')}
                      </span>
                      <p className="text-xs text-zinc-600 dark:text-stone-400">
                        {getAvailableDiscount(customerProfile, loyaltySettings).eligible
                          ? `You have ${customerProfile.total_points} points — ${formatPrice(loyaltySettings?.fixed_discount_amount ?? 0)} off is ready to use`
                          : `${customerProfile.total_points} / ${loyaltySettings?.points_required_for_discount ?? 1000} points — earn a ${formatPrice(loyaltySettings?.fixed_discount_amount ?? 10)} discount`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!getAvailableDiscount(customerProfile, loyaltySettings).eligible}
                      onClick={() => {
                        const next = !applyDiscount;
                        setApplyDiscount(next);
                        if (next) {
                          const { eligible, discountAmount: amt } = getAvailableDiscount(customerProfile, loyaltySettings);
                          setDiscountAmount(eligible ? Math.min(amt, selectedService?.price || 0) : 0);
                        } else {
                          setDiscountAmount(0);
                        }
                      }}
                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${applyDiscount
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-amber-600 text-black hover:bg-amber-500'
                        }`}
                    >
                      {applyDiscount ? 'Applied ✓' : 'Apply Discount'}
                    </button>
                  </div>
                  {applyDiscount && discountAmount > 0 && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                      {t('booking.step3.discountAmount', { amount: discountAmount.toFixed(2) })}
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Grid */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">
                    {t('booking.step3.fullNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      placeholder={t('booking.step3.fullNamePlaceholder')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                      id="booking-fullname-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">
                    {t('booking.step3.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="email"
                      placeholder={t('booking.step3.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                      id="booking-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">
                    {t('booking.step3.phoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="tel"
                      placeholder={t('booking.step3.phonePlaceholder')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                      id="booking-phone-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">
                    {t('booking.step3.notesLabel')}
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      placeholder={t('booking.step3.notesPlaceholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                      id="booking-notes-input"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Code Field */}
              <div>
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">
                  {t('booking.step3.referralCodeLabel', 'Referral Code (optional)')}
                </label>
                <input
                  type="text"
                  placeholder={t('booking.step3.referralCodePlaceholder', 'Got a code from a friend?')}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                  id="booking-referral-code-input"
                />
              </div>

              {/* 🆕 Privacy Notice + Consent — the sentence itself (with its
                  <1>Privacy Policy</1> link marker) now lives entirely in the
                  translation files (en.json / fr.json / de.json) under
                  "booking.step3.privacyNotice". Trans is self-closing here —
                  passing literal "<1>" text as JSX children is invalid JSX
                  syntax (element names can't start with a digit) and is what
                  caused the earlier build error. This mirrors how
                  booking.step4.subtitle / booking.step4.notice already work
                  elsewhere in this same file. */}
              <div className="p-4 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-600 dark:text-stone-400 leading-relaxed">
                    <Trans
                      i18nKey="booking.step3.privacyNotice"
                      components={{
                        1: (
                          <a
                            href="#privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 dark:text-amber-500 underline hover:text-amber-700 dark:hover:text-amber-400 font-medium"
                          />
                        ),
                      }}
                    />
                  </p>
                </div>

                <label
                  htmlFor="booking-privacy-consent-checkbox"
                  className="flex items-start gap-2.5 cursor-pointer group pl-[26px]"
                >
                  <input
                    type="checkbox"
                    required
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-zinc-300 dark:border-stone-700 text-amber-600 focus:ring-amber-600 cursor-pointer shrink-0"
                    id="booking-privacy-consent-checkbox"
                  />
                  <span className="text-xs text-zinc-700 dark:text-stone-300 leading-snug group-hover:text-zinc-900 dark:group-hover:text-stone-100 transition-colors">
                    {t(
                      'booking.step3.consentCheckboxLabel',
                      'I have read and agree to the Privacy Policy, and consent to my data being used to manage this booking.'
                    )}
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-6 border-t border-zinc-200 dark:border-stone-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-700 dark:text-stone-300 hover:text-zinc-900 dark:hover:text-stone-100 font-medium text-xs uppercase tracking-widest cursor-pointer transition-colors"
                >
                  {t('booking.step3.btnBack')}
                </button>

                <button
                  type="submit"
                  disabled={submitting || !consentGiven}
                  className="px-8 py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm dark:shadow-none"
                  id="confirm-submit-booking-btn"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      {t('booking.step3.btnReserving')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('booking.step3.btnSubmit')}
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ✅ STEP 4: SUCCESS CONFIRMATION SCREEN - FULL DISCOUNT DISPLAY */}
          {step === 4 && createdAppointment && (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-400 py-6">

              <div className="w-16 h-16 rounded-sm bg-amber-600 flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="w-8 h-8 text-black" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-light text-zinc-900 dark:text-stone-100">
                  {t('booking.step4.title')}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-stone-400 max-w-md mx-auto">
                  <Trans
                    i18nKey="booking.step4.subtitle"
                    values={{ name: createdAppointment.full_name }}
                    components={{
                      1: <span className="text-zinc-900 dark:text-stone-100 font-bold" />,
                    }}
                  />
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="max-w-md mx-auto p-6 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-left space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-stone-800 pb-3">
                  <span className="text-[10px] text-zinc-500 dark:text-stone-500 uppercase font-bold tracking-widest">
                    {t('booking.step4.bookingId')}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-500">
                    #{createdAppointment.id.slice(0, 8)}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.service')}</span>
                    <span className="font-serif font-bold text-zinc-900 dark:text-stone-100">
                      {createdAppointment.service ? getTranslatedServiceName(createdAppointment.service) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.date')}</span>
                    <span className="font-medium text-zinc-900 dark:text-stone-100">
                      {format(new Date(createdAppointment.appointment_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy', { locale: currentLocale })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.timeSlot')}</span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-500">
                      {createdAppointment.start_time} - {createdAppointment.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.location')}</span>
                    <span className="font-medium text-zinc-900 dark:text-stone-100 text-right max-w-[200px]">
                      {settings.barbershop_address}
                    </span>
                  </div>

                  {/* ✅ FULL DISCOUNT DISPLAY - Price breakdown */}
                  {(() => {
                    const servicePrice = Number(createdAppointment.service?.price || 0);
                    const discountAmt = Number(createdAppointment.discount_amount || 0);
                    const finalTotal = servicePrice - discountAmt;

                    return (
                      <>
                        {/* Original Price */}
                        <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-stone-800/80">
                          <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.totalRate')}</span>
                          <span className={`font-serif font-bold text-sm ${discountAmt > 0 ? 'text-zinc-400 dark:text-stone-600 line-through' : 'text-amber-600 dark:text-amber-500'}`}>
                            {formatPrice(servicePrice)}
                          </span>
                        </div>

                        {/* Discount (if applied) */}
                        {discountAmt > 0 && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span className="text-zinc-600 dark:text-stone-400">{t('booking.step4.discountLabel', 'Discount')}</span>
                            <span className="font-bold">-{formatPrice(discountAmt)}</span>
                          </div>
                        )}

                        {/* Final Total (if discount applied) */}
                        {discountAmt > 0 && (
                          <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-stone-800/80">
                            <span className="text-zinc-600 dark:text-stone-400 font-semibold">{t('booking.step4.finalTotalLabel', 'Final Total')}</span>
                            <span className="font-serif font-bold text-base text-amber-600 dark:text-amber-500">
                              {formatPrice(finalTotal)}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Loyalty Points Earned */}
                  {createdAppointment.points_earned != null && createdAppointment.points_earned > 0 && (
                    <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-stone-800/80 text-amber-600 dark:text-amber-500">
                      <span className="text-zinc-600 dark:text-stone-400">Points Earned</span>
                      <span className="font-bold">+{createdAppointment.points_earned}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-stone-800 text-[11px] text-zinc-500 dark:text-stone-500">
                  <Trans
                    i18nKey="booking.step4.notice"
                    values={{ email: createdAppointment.email }}
                    components={{
                      1: <span className="text-zinc-700 dark:text-stone-300 font-semibold" />,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={handleReset}
                  className="px-8 py-3.5 bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all rounded-sm cursor-pointer shadow-sm dark:shadow-none"
                >
                  {t('booking.step4.btnBookAnother')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};