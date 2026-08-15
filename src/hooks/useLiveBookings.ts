// src/hooks/useLiveBookings.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getShopNow } from '../lib/availability';
import { format } from 'date-fns';
import i18next from 'i18next';

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

interface LiveBookingData {
  totalToday: number;
  newSinceLogin: number;
  peakHour: string;
  peakCount: number;
  lastBookingName: string | null;
  isLive: boolean;
  connectionStatus: ConnectionStatus;
  dailyGoal: number;
  progressPercentage: number;
}

const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_MAX_DELAY_MS = 30000;
const DATE_ROLLOVER_CHECK_MS = 30000; // check for midnight rollover twice a minute

export function useLiveBookings() {
  const [data, setData] = useState<LiveBookingData>({
    totalToday: 0,
    newSinceLogin: 0,
    peakHour: '--:--',
    peakCount: 0,
    lastBookingName: null,
    isLive: false,
    connectionStatus: 'connecting',
    dailyGoal: 25,
    progressPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialCountRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const dailyGoalCacheRef = useRef<number | null>(null);

  // Tracks the date string the current subscription/baseline was set up for,
  // so we can detect a midnight rollover while the tab stays open.
  const activeDateRef = useRef<string>(format(getShopNow(), 'yyyy-MM-dd'));

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const rolloverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getTodayStr = useCallback(() => {
    return format(getShopNow(), 'yyyy-MM-dd');
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    if (!isMountedRef.current) return;
    setData((prev) => ({
      ...prev,
      connectionStatus: status,
      isLive: status === 'live',
    }));
  }, []);

  // Cache daily goal to avoid repeated fetches
  const getDailyGoal = useCallback(async (): Promise<number> => {
    if (dailyGoalCacheRef.current !== null) {
      return dailyGoalCacheRef.current;
    }

    try {
      const { data: settings } = await supabase
        .from('barbershop_settings')
        .select('slot_interval_minutes')
        .maybeSingle();

      if (settings?.slot_interval_minutes) {
        const slotsPerDay = Math.floor(480 / settings.slot_interval_minutes);
        dailyGoalCacheRef.current = Math.max(slotsPerDay, 10);
        return dailyGoalCacheRef.current;
      }
    } catch {
      // Use default
    }

    dailyGoalCacheRef.current = 25;
    return 25;
  }, []);

  const fetchTodayData = useCallback(async (dateOverride?: string) => {
    try {
      const todayStr = dateOverride ?? getTodayStr();

      const { data: appointments, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', todayStr);

      if (fetchError) throw fetchError;

      const confirmedCompleted = appointments?.filter(
        (a) => a.status === 'confirmed' || a.status === 'completed'
      ) || [];

      const total = confirmedCompleted.length;

      const hourCounts: Record<string, number> = {};
      confirmedCompleted.forEach((app) => {
        const hour = app.start_time?.substring(0, 5) || '--:--';
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      let peakHour = '--:--';
      let peakCount = 0;
      const sortedHours = Object.keys(hourCounts).sort();
      sortedHours.forEach((hour) => {
        const count = hourCounts[hour];
        if (count > peakCount) {
          peakCount = count;
          peakHour = hour;
        }
      });

      if (initialCountRef.current === null) {
        initialCountRef.current = total;
      }

      let lastBookingName: string | null = null;
      if (appointments && appointments.length > 0) {
        const sorted = [...appointments].sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        const latestConfirmed = sorted.find(
          (a) => a.status === 'confirmed' || a.status === 'completed'
        );
        if (latestConfirmed) {
          lastBookingName = latestConfirmed.full_name;
        }
      }

      const newSinceLogin = initialCountRef.current !== null
        ? total - initialCountRef.current
        : 0;

      const dailyGoal = await getDailyGoal();
      const progressPercentage = Math.min((total / dailyGoal) * 100, 100);

      if (isMountedRef.current) {
        setData((prev) => ({
          ...prev,
          totalToday: total,
          newSinceLogin: Math.max(0, newSinceLogin),
          peakHour,
          peakCount,
          lastBookingName,
          dailyGoal,
          progressPercentage,
        }));
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error fetching live bookings:', err);
      if (isMountedRef.current) {
        setError(i18next.t('liveCounter.errorLoading', 'Failed to load live bookings'));
        setLoading(false);
      }
    }
  }, [getTodayStr, getDailyGoal]);

  // Resets the "new since login" baseline for a fresh day and refetches.
  const handleDateRollover = useCallback((newDateStr: string) => {
    activeDateRef.current = newDateStr;
    initialCountRef.current = null; // recompute baseline for the new day
    fetchTodayData(newDateStr);
  }, [fetchTodayData]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback((subscribeFn: () => void) => {
    clearReconnectTimer();
    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt),
      RECONNECT_MAX_DELAY_MS
    );
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      subscribeFn();
    }, delay);
  }, [clearReconnectTimer]);

  useEffect(() => {
    isMountedRef.current = true;
    activeDateRef.current = getTodayStr();
    fetchTodayData();

    const subscribe = () => {
      // Tear down any existing channel before creating a new one.
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

      const channelName = `appointments-realtime-${Date.now()}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
          },
          (payload) => {
            const appointment = payload.new || payload.old;
            // Compute "today" fresh on every event instead of relying on a
            // value captured when the effect first ran — otherwise this
            // silently goes stale if the dashboard is left open past midnight.
            const currentTodayStr = getTodayStr();

            if (appointment?.appointment_date === currentTodayStr) {
              if (currentTodayStr !== activeDateRef.current) {
                handleDateRollover(currentTodayStr);
              } else {
                fetchTodayData(currentTodayStr);
              }

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newAppointment = payload.new;
                if (newAppointment?.status === 'confirmed' || newAppointment?.status === 'completed') {
                  window.dispatchEvent(new CustomEvent('newBooking', {
                    detail: {
                      name: newAppointment.full_name,
                      status: newAppointment.status,
                    },
                  }));
                }
              }
            }
          }
        );

      channel.subscribe((status, err) => {
        if (!isMountedRef.current) return;

        if (status === 'SUBSCRIBED') {
          console.log('✅ SUBSCRIBED to realtime updates!');
          reconnectAttemptRef.current = 0;
          clearReconnectTimer();
          setConnectionStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Channel error:', err);
          setConnectionStatus('reconnecting');
          scheduleReconnect(subscribe);
        } else if (status === 'CLOSED') {
          // Only treat as a drop if we didn't close it ourselves on unmount.
          if (isMountedRef.current) {
            setConnectionStatus('offline');
            scheduleReconnect(subscribe);
          }
        }
      });

      channelRef.current = channel;
    };

    subscribe();

    // Safety net: even without a realtime event, catch a midnight rollover
    // (e.g. a quiet shop with no bookings right at midnight) and refresh.
    rolloverIntervalRef.current = setInterval(() => {
      const nowStr = getTodayStr();
      if (nowStr !== activeDateRef.current) {
        handleDateRollover(nowStr);
      }
    }, DATE_ROLLOVER_CHECK_MS);

    return () => {
      isMountedRef.current = false;
      clearReconnectTimer();
      if (rolloverIntervalRef.current) {
        clearInterval(rolloverIntervalRef.current);
        rolloverIntervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Intentionally run once on mount — reconnects/rollovers are handled
    // internally via refs so we don't need to re-run this setup effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => fetchTodayData(),
  };
}