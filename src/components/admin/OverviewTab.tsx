import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Zap,
  UserCheck,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Appointment, Service, Barber } from '../../types';
import { format, addDays } from 'date-fns';
import { createQuickWalkIn, DEFAULT_BARBERS } from '../../lib/supabase';
import { getShopNow } from '../../lib/availability';
import { LiveBookingCounter } from './LiveBookingCounter';
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface OverviewTabProps {
  appointments: Appointment[];
  services: Service[];
  barbers?: Barber[];
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onNavigateToTab: (tab: string) => void;
  onRefreshData?: () => void;
}

type TrendMode = 'revenue' | 'bookings';

export const OverviewTab: React.FC<OverviewTabProps> = ({
  appointments,
  services,
  barbers = DEFAULT_BARBERS,
  onUpdateStatus,
  onNavigateToTab,
  onRefreshData,
}) => {
  const { t, i18n } = useTranslation();

  // Helper function to get translated service name
  const getTranslatedServiceName = (serviceName: string): string => {
    if (!serviceName) return '';
    const translatedName = t(`serviceNames.${serviceName}`, '');
    if (translatedName && translatedName !== `serviceNames.${serviceName}`) {
      return translatedName;
    }
    return serviceName;
  };

  // Helper function to get translated "Walk-in Client"
  const getTranslatedWalkIn = (): string => {
    return t('overviewTab.walkInClient', 'Walk-in Client');
  };

  // Helper function to get translated "Live Chair Buffer"
  const getTranslatedLiveChairBuffer = (): string => {
    return t('overviewTab.liveChairBuffer', 'Live Chair Buffer (Walk-in)');
  };

  // Helper function to get translated "Select Chair / Barber"
  const getTranslatedSelectChair = (): string => {
    return t('overviewTab.selectChair', 'Select Chair / Barber');
  };

  // Helper function to get translated "Date"
  const getTranslatedDate = (): string => {
    return t('overviewTab.date', 'Date');
  };

  // Helper function to get translated "Start Time"
  const getTranslatedStartTime = (): string => {
    return t('overviewTab.startTime', 'Start Time');
  };

  // Helper function to get translated "Duration (Minutes)"
  const getTranslatedDuration = (): string => {
    return t('overviewTab.duration', 'Duration (Minutes)');
  };

  // Helper function to get translated "Client Identifier (Optional)"
  const getTranslatedClientIdentifier = (): string => {
    return t('overviewTab.clientIdentifier', 'Client Identifier (Optional)');
  };

  // Helper function to get translated duration options
  const getTranslatedDurationOptions = () => {
    return {
      minutes30: t('overviewTab.durationOptions.minutes30', '30 Minutes'),
      minutes45: t('overviewTab.durationOptions.minutes45', '45 Minutes (Recommended)'),
      minutes60: t('overviewTab.durationOptions.minutes60', '60 Minutes'),
      minutes90: t('overviewTab.durationOptions.minutes90', '90 Minutes')
    };
  };

  // Helper function to get translated walk-in description
  const getTranslatedWalkInDescription = (): string => {
    return t('overviewTab.walkInDescription', 'This will check the selected barber\'s availability and, if free, instantly reserve the slot so no online customer can book over it.');
  };

  // Helper function to get translated Cancel button
  const getTranslatedCancel = (): string => {
    return t('overviewTab.cancel', 'Cancel');
  };

  // Helper function to get translated Confirm button
  const getTranslatedConfirm = (): string => {
    return t('overviewTab.confirm', 'Confirm Walk-In');
  };

  // Helper function to get translated Checking Availability
  const getTranslatedChecking = (): string => {
    return t('overviewTab.checkingAvailability', 'Checking Availability...');
  };

  // Walk-in Modal States
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || 'barber-mireya');
  const [walkInDate, setWalkInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [walkInTime, setWalkInTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [clientName, setClientName] = useState<string>(getTranslatedWalkIn());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // 🆕 Trend chart mode: Revenue ($) or Busiest Days (# bookings)
  const [trendMode, setTrendMode] = useState<TrendMode>('revenue');

  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  // Calculate today's appointments — anchored to the shop's Geneva timezone,
  // not the visitor's/admin's own device timezone (same fix as the public
  // booking flow).
  const todayStr = format(getShopNow(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);

  // Revenue estimate (completed + confirmed)
  const estimatedRevenue = appointments
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);

  // Pending items needing review
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  // Trend data for the last 14 days (including today), confirmed + completed
  // bookings only, anchored to Geneva time. Tracks BOTH revenue and booking
  // count per day in one pass, so the chart can switch between "Revenue" and
  // "Busiest Days" without recomputing or re-filtering appointments twice.
  const trendData = Array.from({ length: 14 }).map((_, index) => {
    const d = addDays(getShopNow(), index - 13);
    const dateStr = format(d, 'yyyy-MM-dd');
    const label = format(d, 'd');
    const dayAppointments = appointments.filter(
      (a) => a.appointment_date === dateStr && (a.status === 'completed' || a.status === 'confirmed')
    );
    const revenue = dayAppointments.reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);
    const bookingCount = dayAppointments.length;
    return { dateStr, label, revenue, bookingCount };
  });

  const maxDailyRevenue = trendData.reduce((max, d) => Math.max(max, d.revenue), 0);
  const maxDailyBookings = trendData.reduce((max, d) => Math.max(max, d.bookingCount), 0);

  // Busiest single day in the 14-day window (by booking count), used for the
  // small insight line under the toggle. Ties resolve to the earliest date.
  const busiestDay = trendData.reduce<typeof trendData[number] | null>((busiest, d) => {
    if (d.bookingCount === 0) return busiest;
    if (!busiest || d.bookingCount > busiest.bookingCount) return d;
    return busiest;
  }, null);

  const isRevenueMode = trendMode === 'revenue';
  const activeMax = isRevenueMode ? maxDailyRevenue : maxDailyBookings;
  const hasAnyTrendData = maxDailyRevenue > 0 || maxDailyBookings > 0;

  // Most booked services, all time, confirmed + completed bookings only.
  const topServices = (() => {
    const counts = new Map<string, { name: string; count: number }>();
    appointments
      .filter((a) => a.status === 'completed' || a.status === 'confirmed')
      .forEach((a) => {
        const rawName = a.service?.name || t('overviewTab.defaultCustomCut', 'Custom Cut');
        const displayName = a.service?.name ? getTranslatedServiceName(a.service.name) : rawName;
        const existing = counts.get(rawName);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(rawName, { name: displayName, count: 1 });
        }
      });
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();
  const maxServiceCount = topServices.reduce((max, s) => Math.max(max, s.count), 0);

  // Handle Quick Walk-in submission
  const handleQuickWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWalkInError(null);

    try {
      await createQuickWalkIn({
        barberId: selectedBarberId,
        appointmentDate: walkInDate,
        startTime: walkInTime,
        durationMinutes,
        clientName: clientName.trim() || getTranslatedWalkIn(),
        serviceName: '⚡ Quick Walk-In',
      });

      setIsWalkInModalOpen(false);
      setClientName(getTranslatedWalkIn());
      setWalkInError(null);

      // Trigger refresh if callback passed
      if (onRefreshData) {
        onRefreshData();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Failed to create walk-in appointment:', error);
      setWalkInError(error.message || 'Could not record walk-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get translated service name for display
  const getDisplayServiceName = (app: Appointment): string => {
    if (app.service?.name) {
      return getTranslatedServiceName(app.service.name);
    }
    return t('overviewTab.defaultCustomCut', 'Custom Cut');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-100 via-stone-50 to-white dark:from-[#18181f] dark:via-[#1c1a16] dark:to-[#141418] border border-stone-200 dark:border-[#2d2923] flex flex-wrap items-center justify-between gap-6 shadow-sm dark:shadow-xl">
        <div>
          <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
            {t('overviewTab.welcomeTitle', 'Welcome Back, Barbershop Manager')}
          </h2>
          <p className="text-xs text-stone-600 dark:text-[#9c978b] mt-1">
            {t('overviewTab.welcomeSubtitle', 'Real-time shop metrics and appointment pipeline for today, {{date}}', {
              date: format(getShopNow(), 'EEEE, MMMM d, yyyy')
            })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* ⚡ Quick Walk-In Button */}
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 cursor-pointer flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current" />
            {t('overviewTab.btnQuickWalkIn', '⚡ Quick Walk-in')}
          </button>

          {/* Manage Appointments Button */}
          <button
            onClick={() => onNavigateToTab('appointments')}
            className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 dark:bg-[#22201b] dark:border-[#423b2e] dark:text-[#f5f2eb] dark:hover:bg-[#2c2822] font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-2 transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-[#d4af37]" />
            {t('overviewTab.btnManageAppointments', 'Manage Appointments ({{count}} Pending)', { count: pendingCount })}
          </button>
        </div>
      </div>

      {/* 🆕 LIVE BOOKING COUNTER - ADDED HERE */}
      <div className="relative">
        <LiveBookingCounter />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] space-y-3 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-stone-500 dark:text-[#8c877a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('overviewTab.metrics.totalBookings', 'Total Bookings')}
            </span>
            <Calendar className="w-4 h-4 text-amber-600 dark:text-[#d4af37]" />
          </div>
          <div className="text-3xl font-extrabold font-serif text-stone-900 dark:text-[#f5f2eb]">
            {totalCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#8c877a]">
            {t('overviewTab.metrics.allTimeRecord', 'All time record')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] space-y-3 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-stone-500 dark:text-[#8c877a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('overviewTab.metrics.pendingAction', 'Pending Action')}
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-serif text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#8c877a]">
            {t('overviewTab.metrics.awaitingApproval', 'Awaiting approval')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] space-y-3 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-stone-500 dark:text-[#8c877a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('overviewTab.metrics.todaysCutSchedule', "Today's Cut Schedule")}
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-[#e5c158]" />
          </div>
          <div className="text-3xl font-extrabold font-serif text-amber-600 dark:text-[#e5c158]">
            {todayAppointments.length}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#8c877a]">
            {t('overviewTab.metrics.appointmentsToday', 'Appointments for today')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] space-y-3 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-stone-500 dark:text-[#8c877a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('overviewTab.metrics.estimatedRevenue', 'Estimated Revenue')}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-serif text-emerald-600 dark:text-emerald-400">
            {formatPrice(estimatedRevenue)}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-[#8c877a]">
            {t('overviewTab.metrics.confirmedAndCompleted', 'Confirmed & completed cuts')}
          </p>
        </div>

      </div>

      {/* Business Insights: Trend Chart (Revenue / Busiest Days) & Top Services */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Trend Chart (last 14 days) — toggles between Revenue and Busiest Days */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] p-6 space-y-5 shadow-sm dark:shadow-xl">
          <div className="border-b border-stone-100 dark:border-[#26231e] pb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
                {isRevenueMode
                  ? t('overviewTab.analytics.revenueTrendTitle', 'Revenue Trend (Last 14 Days)')
                  : t('overviewTab.analytics.busiestDaysTitle', 'Busiest Days (Last 14 Days)')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#9c978b]">
                {isRevenueMode
                  ? t('overviewTab.analytics.revenueTrendSubtitle', 'Confirmed & completed bookings, by day')
                  : t('overviewTab.analytics.busiestDaysSubtitle', 'Confirmed & completed appointments, by day')}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#0f0f12] border border-stone-200 dark:border-[#26231e]">
              <button
                type="button"
                onClick={() => setTrendMode('revenue')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${isRevenueMode
                    ? 'bg-white dark:bg-[#26231e] text-amber-700 dark:text-[#e5c158] shadow-sm'
                    : 'text-stone-500 dark:text-[#8c877a] hover:text-stone-800 dark:hover:text-[#c9c4b8]'
                  }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                {t('overviewTab.analytics.toggleRevenue', 'Revenue')}
              </button>
              <button
                type="button"
                onClick={() => setTrendMode('bookings')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${!isRevenueMode
                    ? 'bg-white dark:bg-[#26231e] text-amber-700 dark:text-[#e5c158] shadow-sm'
                    : 'text-stone-500 dark:text-[#8c877a] hover:text-stone-800 dark:hover:text-[#c9c4b8]'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {t('overviewTab.analytics.toggleBookings', 'Busiest Days')}
              </button>
            </div>
          </div>

          {!hasAnyTrendData ? (
            <div className="py-12 text-center text-stone-400 dark:text-[#807b70] space-y-2">
              {isRevenueMode ? (
                <DollarSign className="w-8 h-8 text-amber-500 dark:text-[#d4af37] mx-auto opacity-50" />
              ) : (
                <Calendar className="w-8 h-8 text-amber-500 dark:text-[#d4af37] mx-auto opacity-50" />
              )}
              <p className="text-sm font-semibold text-stone-800 dark:text-[#f5f2eb]">
                {isRevenueMode
                  ? t('overviewTab.analytics.noRevenueTitle', 'No Revenue Yet In This Window')
                  : t('overviewTab.analytics.noBookingsTitle', 'No Bookings Yet In This Window')}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-1.5 h-40 pt-4">
                {trendData.map((d) => {
                  const value = isRevenueMode ? d.revenue : d.bookingCount;
                  const heightPct = value > 0 && activeMax > 0 ? Math.max((value / activeMax) * 100, 6) : 0;
                  const tooltip = isRevenueMode
                    ? formatPrice(d.revenue)
                    : `${d.bookingCount} ${d.bookingCount === 1
                      ? t('overviewTab.analytics.bookingSingular', 'booking')
                      : t('overviewTab.analytics.bookingPlural', 'bookings')}`;
                  return (
                    <div
                      key={d.dateStr}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group" title={tooltip}
                    >
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 dark:from-[#b8860b] dark:to-[#d4af37] transition-all group-hover:brightness-110"
                        style={{ height: `${heightPct}%`, minHeight: value > 0 ? '4px' : '0px' }}
                      />
                      <span className="text-[9px] text-stone-500 dark:text-[#8c877a] font-medium">{d.label}</span>
                    </div>
                  );
                })}
              </div>

              {!isRevenueMode && busiestDay && (
                <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-[#a39e91] pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#d4af37] shrink-0" />
                  <span>
                    {t('overviewTab.analytics.busiestDayInsight', 'Busiest day: {{date}} with {{count}} bookings', {
                      date: busiestDay.dateStr,
                      count: busiestDay.bookingCount,
                    })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Top Services */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] p-6 space-y-5 shadow-sm dark:shadow-xl">
          <div className="border-b border-stone-100 dark:border-[#26231e] pb-4">
            <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
              {t('overviewTab.analytics.topServicesTitle', 'Most Booked Services')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-[#9c978b]">
              {t('overviewTab.analytics.topServicesSubtitle', 'By confirmed & completed bookings, all time')}
            </p>
          </div>

          {topServices.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-[#807b70] space-y-2">
              <Calendar className="w-8 h-8 text-amber-500 dark:text-[#d4af37] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-stone-800 dark:text-[#f5f2eb]">
                {t('overviewTab.analytics.noServicesTitle', 'No Bookings Yet')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((s) => {
                const widthPct = maxServiceCount > 0 ? (s.count / maxServiceCount) * 100 : 0;
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 dark:text-[#f5f2eb]">{s.name}</span>
                      <span className="text-stone-500 dark:text-[#9c978b] font-mono">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 dark:bg-[#201f26] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 dark:from-[#d4af37] dark:to-[#b8860b]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Two-Column Section: Pending Approvals & Today's Schedule */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Pending Approval Requests */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] p-6 space-y-5 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#26231e] pb-4">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
                {t('overviewTab.pendingQueue.title', 'Pending Approval Queue')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#9c978b]">
                {t('overviewTab.pendingQueue.subtitle', 'Review and confirm incoming client bookings')}
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/60 dark:text-amber-300">
              {t('overviewTab.pendingQueue.badgePending', '{{count}} Pending', { count: pendingAppointments.length })}
            </span>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-[#807b70] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <p className="text-sm font-semibold text-stone-800 dark:text-[#f5f2eb]">
                {t('overviewTab.pendingQueue.queueClearTitle', 'Queue Clear')}
              </p>
              <p className="text-xs text-stone-500 dark:text-[#807b70]">
                {t('overviewTab.pendingQueue.queueClearSubtitle', 'All booking requests have been reviewed.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {pendingAppointments.map((app) => {
                const translatedServiceName = getDisplayServiceName(app);
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1a1a20] border border-stone-200 dark:border-[#2d2a24] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 dark:text-[#f5f2eb]">{app.full_name}</span>
                        <span className="text-[11px] font-mono text-amber-700 bg-amber-50 dark:text-[#d4af37] dark:bg-[#121215] px-2 py-0.5 rounded border border-amber-200 dark:border-[#332f28]">
                          {app.start_time} - {app.end_time}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-[#a39e91]">
                        {translatedServiceName} • {app.appointment_date}
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-[#78746a]">{app.phone} • {app.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onUpdateStatus(app.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 dark:bg-emerald-950/80 dark:hover:bg-emerald-800 dark:border-emerald-700/80 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('overviewTab.pendingQueue.btnConfirm', 'Confirm')}
                      </button>
                      <button
                        onClick={() => onUpdateStatus(app.id, 'cancelled')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 dark:bg-red-950/80 dark:hover:bg-red-900 dark:border-red-800/80 dark:text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {t('overviewTab.pendingQueue.btnCancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule Overview */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#2d2923] p-6 space-y-5 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#26231e] pb-4">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
                {t('overviewTab.todaysAppointments.title', "Today's Appointments")}
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#9c978b]">{todayStr}</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-amber-700 dark:bg-[#201f26] dark:border-[#302e38] dark:text-[#e5c158]">
              {t('overviewTab.todaysAppointments.badgeTotal', '{{count}} Total', { count: todayAppointments.length })}
            </span>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-[#807b70] space-y-2">
              <Clock className="w-8 h-8 text-amber-500 dark:text-[#d4af37] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-stone-800 dark:text-[#f5f2eb]">
                {t('overviewTab.todaysAppointments.emptyTitle', 'No Cuts Scheduled For Today')}
              </p>
              <p className="text-xs text-stone-500 dark:text-[#807b70]">
                {t('overviewTab.todaysAppointments.emptySubtitle', 'Upcoming appointments will appear here.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {todayAppointments.map((app) => {
                const translatedServiceName = getDisplayServiceName(app);
                return (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#18181d] border border-stone-200 dark:border-[#2a2722] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 dark:text-[#f5f2eb] block">{app.full_name}</span>
                      <span className="text-stone-500 dark:text-[#999488]">{translatedServiceName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-amber-700 dark:text-[#e5c158] font-bold block">{app.start_time}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase ${app.status === 'confirmed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : app.status === 'completed'
                            ? 'text-blue-600 dark:text-blue-400'
                            : app.status === 'pending'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                      >
                        {t(`overviewTab.status.${app.status}`, app.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ⚡ Live Chair Buffer Modal (Quick Walk-in) - FULLY TRANSLATED */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16161a] border border-stone-200 dark:border-[#38332b] rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#2a2620] pb-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="text-lg font-serif text-stone-900 dark:text-[#f5f2eb]">
                  {getTranslatedLiveChairBuffer()}
                </h3>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 dark:text-[#888378] hover:text-stone-700 dark:hover:text-[#f5f2eb] hover:bg-stone-100 dark:hover:bg-[#25231c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#a8a396] mb-1.5">
                  {getTranslatedSelectChair()}
                </label>
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#101013] border border-stone-300 dark:border-[#332f28] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-500"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} ({b.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#a8a396] mb-1.5">
                    {getTranslatedDate()}
                  </label>
                  <input
                    type="date"
                    value={walkInDate}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#101013] border border-stone-300 dark:border-[#332f28] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#a8a396] mb-1.5">
                    {getTranslatedStartTime()}
                  </label>
                  <input
                    type="time"
                    value={walkInTime}
                    onChange={(e) => setWalkInTime(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#101013] border border-stone-300 dark:border-[#332f28] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#a8a396] mb-1.5">
                  {getTranslatedDuration()}
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-[#101013] border border-stone-300 dark:border-[#332f28] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-500"
                >
                  <option value={30}>{getTranslatedDurationOptions().minutes30}</option>
                  <option value={45}>{getTranslatedDurationOptions().minutes45}</option>
                  <option value={60}>{getTranslatedDurationOptions().minutes60}</option>
                  <option value={90}>{getTranslatedDurationOptions().minutes90}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-[#a8a396] mb-1.5">
                  {getTranslatedClientIdentifier()}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={getTranslatedWalkIn()}
                  className="w-full bg-stone-50 dark:bg-[#101013] border border-stone-300 dark:border-[#332f28] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-[#f5f2eb] placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {walkInError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <span>{walkInError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#211d16] border border-amber-200 dark:border-[#3b3425] text-xs text-amber-900 dark:text-[#b8b2a5] flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{getTranslatedWalkInDescription()}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-[#888378] hover:text-stone-900 dark:hover:text-[#f5f2eb] hover:bg-stone-100 dark:hover:bg-[#201e19] transition-colors"
                >
                  {getTranslatedCancel()}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? getTranslatedChecking() : getTranslatedConfirm()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};