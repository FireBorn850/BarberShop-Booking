import React, { useState } from 'react';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BlockedDate } from '../../types';
import { supabase, isSupabaseConnected } from '../../lib/supabase';
import { format } from 'date-fns';

interface BlockedDatesTabProps {
  blockedDates: BlockedDate[];
  onBlockedDatesUpdated: () => void;
}

export const BlockedDatesTab: React.FC<BlockedDatesTabProps> = ({
  blockedDates,
  onBlockedDatesUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual localization for dates (no date-fns locale imports needed)
  const getLocalizedDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const lang = i18n.language || 'en';
    
    const days = {
      de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    };
    
    const months = {
      de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    };
    
    const dayNames = days[lang as keyof typeof days] || days.en;
    const monthNames = months[lang as keyof typeof months] || months.en;
    
    return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Helper function to get translated "Holiday / Shop Closed"
  const getDefaultReason = (): string => {
    return t('blockedDatesTab.defaultReason', 'Holiday / Shop Closed');
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setErrorMsg(t('blockedDatesTab.errorSelectDate', 'Please select a date to block.'));
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (isSupabaseConnected()) {
        const { error } = await supabase.from('blocked_dates').insert([
          {
            blocked_date: newDate,
            reason: reason.trim() || getDefaultReason(),
          },
        ]);

        if (error) throw error;
      }

      setNewDate('');
      setReason('');
      onBlockedDatesUpdated();
    } catch (err: any) {
      console.error('Error adding blocked date:', err);
      setErrorMsg(
        err.message ||
          t(
            'blockedDatesTab.errorFailedToAdd',
            'Failed to add blocked date. (Date may already be blocked).'
          )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      if (isSupabaseConnected()) {
        const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
        if (error) throw error;
      }
      onBlockedDatesUpdated();
    } catch (err) {
      console.error('Error deleting blocked date:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-stone-800">
        <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-stone-100">
          {t('blockedDatesTab.title', 'Blocked Dates & Holidays')}
        </h2>
        <p className="text-xs text-zinc-600 dark:text-stone-400">
          {t(
            'blockedDatesTab.subtitle',
            'Block specific calendar days (e.g., national holidays, staff retreats, maintenance). Clients will not be able to book time slots on blocked dates.'
          )}
        </p>
      </div>

      {/* Add Blocked Date Form Card */}
      <form
        onSubmit={handleAddBlockedDate}
        className="p-6 rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 space-y-4 shadow-sm dark:shadow-xl transition-colors duration-300"
      >
        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
          {t('blockedDatesTab.addNewTitle', 'Add New Blocked Date')}
        </h3>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-stone-300 font-semibold mb-1.5">
              {t('blockedDatesTab.labelBlockedDate', 'Blocked Date *')}
            </label>
            <input
              required
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-amber-700 dark:text-amber-400 font-bold focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-stone-300 font-semibold mb-1.5">
              {t('blockedDatesTab.labelReason', 'Reason / Holiday Name')}
            </label>
            <input
              type="text"
              placeholder={t('blockedDatesTab.placeholderReason', 'e.g. Christmas Day, Staff Renovation')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {saving
              ? t('blockedDatesTab.btnAdding', 'Adding...')
              : t('blockedDatesTab.btnBlockSelected', 'Block Selected Date')}
          </button>
        </div>
      </form>

      {/* Existing Blocked Dates Table */}
      <div className="rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 p-6 space-y-4 shadow-sm dark:shadow-xl transition-colors duration-300">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-stone-100 font-serif">
          {t('blockedDatesTab.currentlyBlockedTitle', 'Currently Blocked Calendar Dates')} ({blockedDates.length})
        </h3>

        {blockedDates.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 dark:text-stone-500 text-xs">
            {t(
              'blockedDatesTab.noBlockedDates',
              'No blocked dates configured. The shop operates on standard business hours.'
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-stone-800/80">
            {blockedDates.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-stone-100 block">
                      {getLocalizedDate(b.blocked_date)}
                    </span>
                    <span className="text-zinc-500 dark:text-stone-400">
                      {b.reason || t('blockedDatesTab.noReasonSpecified', 'No reason specified')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveBlockedDate(b.id)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all cursor-pointer"
                  title={t('blockedDatesTab.titleRemoveBlock', 'Remove Date Block')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};