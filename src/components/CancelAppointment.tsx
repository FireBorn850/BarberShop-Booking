import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConnected } from '../lib/supabase';

interface CancelAppointmentProps {
  appointmentId: string;
  onReturnHome: () => void;
}

interface AppointmentSummary {
  fullName: string;
  serviceName: string | null;
  barberName: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

type ResultState =
  | { kind: 'loading' }
  | { kind: 'cancelled'; summary: AppointmentSummary }
  | { kind: 'already_cancelled'; summary: AppointmentSummary }
  | { kind: 'already_completed'; summary: AppointmentSummary }
  | { kind: 'not_found' }
  | { kind: 'error' };

export const CancelAppointment: React.FC<CancelAppointmentProps> = ({ appointmentId, onReturnHome }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<ResultState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isSupabaseConnected()) {
        if (!cancelled) setResult({ kind: 'error' });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('cancel-appointment', {
          body: { appointmentId },
        });

        if (cancelled) return;

        if (error || !data) {
          setResult({ kind: 'error' });
          return;
        }

        if (!data.success) {
          if (data.reason === 'not_found') {
            setResult({ kind: 'not_found' });
          } else if (data.reason === 'already_completed') {
            setResult({ kind: 'already_completed', summary: data.appointment });
          } else {
            setResult({ kind: 'error' });
          }
          return;
        }

        if (data.alreadyCancelled) {
          setResult({ kind: 'already_cancelled', summary: data.appointment });
        } else {
          setResult({ kind: 'cancelled', summary: data.appointment });
        }
      } catch (err) {
        if (!cancelled) setResult({ kind: 'error' });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const renderSummary = (summary: AppointmentSummary) => (
    <div className="p-5 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-left space-y-2 text-xs">
      {summary.serviceName && (
        <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-stone-400">{t('cancelPage.service', 'Service')}</span>
          <span className="font-bold text-zinc-900 dark:text-stone-100">{summary.serviceName}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-zinc-600 dark:text-stone-400">{t('cancelPage.date', 'Date')}</span>
        <span className="font-medium text-zinc-900 dark:text-stone-100">{summary.appointmentDate}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-600 dark:text-stone-400">{t('cancelPage.time', 'Time')}</span>
        <span className="font-mono font-bold text-amber-600 dark:text-amber-500">
          {summary.startTime} - {summary.endTime}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-stone-100">
      <div className="max-w-md w-full rounded-sm bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-8 shadow-xl dark:shadow-2xl text-center space-y-6">

        <div className="w-14 h-14 rounded-sm bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mx-auto">
          <Scissors className="w-6 h-6 text-amber-600 dark:text-amber-500" />
        </div>

        {result.kind === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-500 mx-auto animate-spin" />
            <p className="text-sm text-zinc-600 dark:text-stone-400">
              {t('cancelPage.loading', 'Cancelling your appointment...')}
            </p>
          </div>
        )}

        {result.kind === 'cancelled' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h2 className="text-xl font-serif font-bold">
              {t('cancelPage.cancelledTitle', 'Appointment Cancelled')}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-stone-400">
              {t('cancelPage.cancelledSubtitle', 'Your appointment has been cancelled. We hope to see you another time.')}
            </p>
            {renderSummary(result.summary)}
          </div>
        )}

        {result.kind === 'already_cancelled' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h2 className="text-xl font-serif font-bold">
              {t('cancelPage.alreadyCancelledTitle', 'Already Cancelled')}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-stone-400">
              {t('cancelPage.alreadyCancelledSubtitle', 'This appointment was already cancelled.')}
            </p>
            {renderSummary(result.summary)}
          </div>
        )}

        {result.kind === 'already_completed' && (
          <div className="space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto" />
            <h2 className="text-xl font-serif font-bold">
              {t('cancelPage.completedTitle', 'This Appointment Is Already Completed')}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-stone-400">
              {t('cancelPage.completedSubtitle', 'Completed appointments cannot be cancelled. Please contact us directly if something is wrong.')}
            </p>
            {renderSummary(result.summary)}
          </div>
        )}

        {result.kind === 'not_found' && (
          <div className="space-y-4">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
            <h2 className="text-xl font-serif font-bold">
              {t('cancelPage.notFoundTitle', 'Appointment Not Found')}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-stone-400">
              {t('cancelPage.notFoundSubtitle', 'We could not find this appointment. It may have already been removed.')}
            </p>
          </div>
        )}

        {result.kind === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
            <h2 className="text-xl font-serif font-bold">
              {t('cancelPage.errorTitle', 'Something Went Wrong')}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-stone-400">
              {t('cancelPage.errorSubtitle', 'We could not process your request. Please try again or contact us directly.')}
            </p>
          </div>
        )}

        <button
          onClick={onReturnHome}
          className="px-6 py-3 rounded-sm bg-amber-600 text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all cursor-pointer"
        >
          {t('cancelPage.btnReturnHome', 'Return To Homepage')}
        </button>

      </div>
    </div>
  );
};