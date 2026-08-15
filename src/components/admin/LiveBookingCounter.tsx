// src/components/admin/LiveBookingCounter.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Zap, TrendingUp, Clock, Sparkles, PartyPopper, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLiveBookings } from '../../hooks/useLiveBookings';

export const LiveBookingCounter: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useLiveBookings();
  const [showCelebration, setShowCelebration] = useState(false);
  const [newBookingName, setNewBookingName] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleNewBooking = (event: CustomEvent) => {
      const name = event.detail?.name || t('liveCounter.someone', 'Someone');
      const status = event.detail?.status || 'confirmed';

      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }

      setNewBookingName(name);
      setShowCelebration(true);

      celebrationTimeoutRef.current = setTimeout(() => {
        setShowCelebration(false);
        setNewBookingName(null);
        celebrationTimeoutRef.current = null;
      }, 5000);
    };

    window.addEventListener('newBooking', handleNewBooking as EventListener);
    return () => {
      window.removeEventListener('newBooking', handleNewBooking as EventListener);
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, [t]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl p-4 border border-amber-500/30 h-32" />
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 border border-red-300 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
        <span>⚠️ {error}</span>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-red-100 dark:bg-red-900/50 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
        >
          {t('liveCounter.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const statusConfig = {
    live: {
      dotClass: 'bg-green-500',
      pingClass: 'bg-green-400',
      showPing: true,
      label: t('liveCounter.liveLabel', 'LIVE • Instant Updates'),
    },
    connecting: {
      dotClass: 'bg-amber-300',
      pingClass: 'bg-amber-200',
      showPing: true,
      label: t('liveCounter.connectingLabel', 'Connecting…'),
    },
    reconnecting: {
      dotClass: 'bg-amber-300',
      pingClass: 'bg-amber-200',
      showPing: true,
      label: t('liveCounter.reconnectingLabel', 'Reconnecting…'),
    },
    offline: {
      dotClass: 'bg-red-400',
      pingClass: 'bg-red-300',
      showPing: false,
      label: t('liveCounter.offlineLabel', 'Offline • Updates Paused'),
    },
  } as const;

  const status = statusConfig[data.connectionStatus];

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 rounded-2xl p-6 shadow-2xl border border-amber-400/30">

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {status.showPing && (
                <span className={`animate-ping absolute inline-flex h-3 w-3 rounded-full ${status.pingClass} opacity-75`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status.dotClass}`}></span>
            </div>
            <span className="text-white/90 text-xs font-bold uppercase tracking-[0.15em] flex items-center">
              {data.connectionStatus === 'offline' ? (
                <WifiOff className="inline w-3 h-3 mr-1" />
              ) : (
                <Bell className="inline w-3 h-3 mr-1" />
              )}
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {data.newSinceLogin > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1"
              >
                <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                +{data.newSinceLogin} {t('liveCounter.newLabel', 'new')}
              </motion.div>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-all disabled:opacity-50"
              title={t('liveCounter.refreshTitle', 'Refresh')}
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {data.connectionStatus === 'offline' && (
          <div className="relative mt-3 bg-black/20 backdrop-blur-sm rounded-xl px-3 py-2 text-white/90 text-xs font-medium">
            {t('liveCounter.offlineHint', "Connection lost — the numbers below may be out of date. We'll reconnect automatically, or hit refresh.")}
          </div>
        )}

        <div className="relative mt-3">
          <motion.div
            key={data.totalToday}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-end gap-3"
          >
            <span className="text-6xl font-black text-white tracking-tight font-serif">
              {data.totalToday}
            </span>
            <span className="text-white/80 text-lg font-medium mb-1.5">
              {t('liveCounter.bookingsToday', 'bookings today')}
            </span>
          </motion.div>

          <div className="mt-3 bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-white rounded-full shadow-lg"
            />
          </div>
          <div className="flex justify-between text-white/70 text-[10px] mt-1 font-medium">
            <span>{t('liveCounter.progressLabel', 'Progress to daily goal')}</span>
            <span>{Math.round(data.progressPercentage)}%</span>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-wider font-bold">
              <TrendingUp className="w-3 h-3" />
              {t('liveCounter.peakHour', 'Peak Hour')}
            </div>
            <div className="text-white font-bold text-lg mt-0.5">
              {data.peakHour}
              <span className="text-white/60 text-xs ml-1">({data.peakCount})</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-wider font-bold">
              <Clock className="w-3 h-3" />
              {t('liveCounter.lastBooking', 'Last Booking')}
            </div>
            <div className="text-white font-bold text-lg mt-0.5 truncate">
              {data.lastBookingName || t('liveCounter.noBooking', '—')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-wider font-bold">
              <Sparkles className="w-3 h-3" />
              {t('liveCounter.todaysGoal', "Today's Goal")}
            </div>
            <div className="text-white font-bold text-lg mt-0.5">
              {data.dailyGoal}
              <span className="text-white/60 text-xs ml-1">{t('liveCounter.target', 'target')}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCelebration && newBookingName && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl px-8 py-6 border border-amber-500/30 shadow-2xl text-center">
              <div className="text-6xl mb-3">🎊</div>
              <div className="text-white text-2xl font-bold font-serif">
                {t('liveCounter.newBookingTitle', 'New Booking!')}
              </div>
              <div className="text-amber-400 text-xl font-bold mt-1">{newBookingName}</div>
              <div className="text-white/60 text-sm mt-2">
                <PartyPopper className="inline w-4 h-4 mr-1" />
                {data.totalToday} {t('liveCounter.bookingsToday', 'bookings today')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};