import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BusinessHour } from '../../types';
import { supabase, isSupabaseConnected } from '../../lib/supabase';

interface BusinessHoursTabProps {
  businessHours: BusinessHour[];
  onHoursUpdated: () => void;
}

export const BusinessHoursTab: React.FC<BusinessHoursTabProps> = ({
  businessHours,
  onHoursUpdated,
}) => {
  const { t } = useTranslation();

  const weekdayNames = [
    { num: 1, nameKey: 'monday', defaultName: 'Monday' },
    { num: 2, nameKey: 'tuesday', defaultName: 'Tuesday' },
    { num: 3, nameKey: 'wednesday', defaultName: 'Wednesday' },
    { num: 4, nameKey: 'thursday', defaultName: 'Thursday' },
    { num: 5, nameKey: 'friday', defaultName: 'Friday' },
    { num: 6, nameKey: 'saturday', defaultName: 'Saturday' },
    { num: 0, nameKey: 'sunday', defaultName: 'Sunday' },
  ];

  const [hoursState, setHoursState] = useState<BusinessHour[]>(businessHours);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleToggleOpen = (weekday: number) => {
    setHoursState((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, is_open: !h.is_open } : h))
    );
  };

  const handleTimeChange = (weekday: number, field: 'start_time' | 'end_time', value: string) => {
    setHoursState((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMsg(null);

    try {
      if (isSupabaseConnected()) {
        for (const item of hoursState) {
          if (item.id) {
            await supabase
              .from('business_hours')
              .update({
                is_open: item.is_open,
                start_time: item.start_time,
                end_time: item.end_time,
              })
              .eq('id', item.id);
          } else {
            await supabase.from('business_hours').upsert([
              {
                weekday: item.weekday,
                is_open: item.is_open,
                start_time: item.start_time,
                end_time: item.end_time,
              },
            ]);
          }
        }
      }

      onHoursUpdated();
      setMsg(t('businessHoursTab.successMsg', 'Business hours updated successfully!'));
    } catch (err: any) {
      console.error('Error saving business hours:', err);
      setMsg(t('businessHoursTab.errorMsg', 'Failed to update business hours.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-stone-800">
        <div>
          <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-stone-100">
            {t('businessHoursTab.header.title', 'Working Hours Schedule')}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-stone-400">
            {t('businessHoursTab.header.subtitle', 'Set opening and closing times for each weekday. These hours dictate available online booking slots.')}
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving 
            ? t('businessHoursTab.header.btnSaving', 'Saving Changes...') 
            : t('businessHoursTab.header.btnSave', 'Save Schedule')}
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-[#1c1a16] border border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Weekday Hours List */}
      <div className="space-y-3">
        {weekdayNames.map(({ num, nameKey, defaultName }) => {
          const item = hoursState.find((h) => h.weekday === num) || {
            weekday: num,
            is_open: true,
            start_time: '09:00',
            end_time: '19:00',
          };

          const dayLabel = t(`businessHoursTab.days.${nameKey}`, defaultName);

          return (
            <div
              key={num}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                item.is_open
                  ? 'bg-white dark:bg-[#0C0C0C] border-zinc-200 dark:border-stone-800'
                  : 'bg-zinc-50 dark:bg-[#111114]/60 border-zinc-200 dark:border-stone-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center gap-4 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => handleToggleOpen(num)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    item.is_open 
                      ? 'bg-amber-600 dark:bg-amber-500' 
                      : 'bg-zinc-300 dark:bg-stone-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white dark:bg-[#0a0a0c] transition-transform absolute top-0.5 ${
                      item.is_open ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>

                <span className="font-serif font-bold text-sm text-zinc-900 dark:text-stone-100">
                  {dayLabel}
                </span>
              </div>

              {item.is_open ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-stone-400">
                    {t('businessHoursTab.opens', 'Opens:')}
                  </span>
                  <input
                    type="time"
                    value={item.start_time}
                    onChange={(e) => handleTimeChange(num, 'start_time', e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-amber-700 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                  />

                  <span className="text-zinc-600 dark:text-stone-400">
                    {t('businessHoursTab.closes', 'Closes:')}
                  </span>
                  <input
                    type="time"
                    value={item.end_time}
                    onChange={(e) => handleTimeChange(num, 'end_time', e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-amber-700 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
                  />
                </div>
              ) : (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-md border border-red-200 dark:border-red-900/50">
                  {t('businessHoursTab.closedDay', 'Closed on {{day}}', { day: dayLabel })}
                </span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};