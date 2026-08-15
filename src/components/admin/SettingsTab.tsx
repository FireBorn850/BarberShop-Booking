import React, { useState } from 'react';
import { Save, Building, Mail, Phone, MapPin, CheckCircle2, Copy, Database, Bell, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarbershopSettings } from '../../types';
import { supabase, isSupabaseConnected } from '../../lib/supabase';

interface SettingsTabProps {
  settings: BarbershopSettings;
  onSettingsUpdated: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const [formState, setFormState] = useState<BarbershopSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingReminders, setTestingReminders] = useState(false);

  // Helper function to get translated shop name
  const getTranslatedShopName = (): string => {
    return t('settingsTab.barbershopName', 'Crown & Cut Grooming Co.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      if (isSupabaseConnected()) {
        const payload = {
          barbershop_name: formState.barbershop_name,
          barbershop_email: formState.barbershop_email,
          barbershop_phone: formState.barbershop_phone,
          barbershop_address: formState.barbershop_address,
          slot_interval_minutes: Number(formState.slot_interval_minutes),
          booking_notice_hours: Number(formState.booking_notice_hours),
          reminders_enabled: formState.reminders_enabled ?? true,
          reminder_hours_before: Number(formState.reminder_hours_before ?? 2),
          reminder_methods: formState.reminder_methods || 'email,sms',
        };

        if (formState.id) {
          await supabase
            .from('barbershop_settings')
            .update(payload)
            .eq('id', formState.id);
        } else {
          await supabase.from('barbershop_settings').insert([payload]);
        }
      }

      onSettingsUpdated();
      setMsg(t('settingsTab.successMsg', 'Barbershop settings saved successfully!'));
    } catch (err: any) {
      console.error('Error updating barbershop settings:', err);
      setMsg(t('settingsTab.errorMsg', 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const copySqlSchema = () => {
    const sqlScript = `-- CROWN & CUT GROOMING CO. - SUPABASE DATABASE SCHEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekday INTEGER NOT NULL UNIQUE,
    is_open BOOLEAN NOT NULL DEFAULT true,
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '19:00'
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocked_date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.barbershop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_name TEXT NOT NULL DEFAULT 'Crown & Cut Grooming Co.',
    barbershop_email TEXT NOT NULL DEFAULT 'azizovjasur2007@gmail.com',
    barbershop_phone TEXT NOT NULL DEFAULT '+998 50 909 40 45',
    barbershop_address TEXT NOT NULL DEFAULT 'Rte de Collex 15, 1293 Bellevue, Geneva, Switzerland',
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    booking_notice_hours INTEGER NOT NULL DEFAULT 2,
    reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_hours_before INTEGER NOT NULL DEFAULT 2,
    reminder_methods TEXT NOT NULL DEFAULT 'email,sms',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MIGRATION SCRIPT (For existing DB tables without reminder columns)
ALTER TABLE public.barbershop_settings 
ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS reminder_methods TEXT DEFAULT 'email,sms';

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestReminders = async () => {
    setTestingReminders(true);
    setMsg(null);

    try {
      const response = await supabase.functions.invoke('send-reminders', {
        body: {},
      });

      if (response.data?.success) {
        setMsg(`✅ Reminders test successful! Sent ${response.data.remindersSent} reminder(s). Check your email/phone.`);
      } else {
        setMsg(`⚠️ Test completed but no reminders were sent. Check logs for details.`);
      }
    } catch (err: any) {
      console.error('Reminder test error:', err);
      setMsg(`❌ Reminder test failed: ${err.message || 'Unknown error'}`);
    } finally {
      setTestingReminders(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">

      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-[#2d2a24]">
        <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-[#f5f2eb]">
          {t('settingsTab.header.title', 'Barbershop Business Profile')}
        </h2>
        <p className="text-xs text-zinc-600 dark:text-[#9c978b]">
          {t('settingsTab.header.subtitle', 'Update studio contact information, appointment slot intervals, and advance booking rules.')}
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#1c1a16] border border-amber-300 dark:border-[#d4af37]/50 text-amber-900 dark:text-[#e5c158] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-[#e5c158]" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-[#2d2a24] space-y-6 shadow-sm dark:shadow-xl text-xs transition-colors duration-300">

        {/* Contact Info Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-amber-600 dark:text-[#d4af37] font-serif border-b border-zinc-100 dark:border-[#24211b] pb-2">
            {t('settingsTab.contactSection.title', 'Public Studio Contact Details')}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.contactSection.barbershopName', 'Barbershop Name')}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-zinc-400 dark:text-[#736e62] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formState.barbershop_name}
                  onChange={(e) => setFormState({ ...formState, barbershop_name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-zinc-900 dark:text-[#f5f2eb] font-bold focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.contactSection.phone', 'Direct Phone Line')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 dark:text-[#736e62] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formState.barbershop_phone}
                  onChange={(e) => setFormState({ ...formState, barbershop_phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-zinc-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.contactSection.email', 'Business Email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-[#736e62] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formState.barbershop_email}
                  onChange={(e) => setFormState({ ...formState, barbershop_email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-zinc-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.contactSection.address', 'Studio Physical Address')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 dark:text-[#736e62] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formState.barbershop_address}
                  onChange={(e) => setFormState({ ...formState, barbershop_address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-zinc-900 dark:text-[#f5f2eb] focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rules Group */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-amber-600 dark:text-[#d4af37] font-serif border-b border-zinc-100 dark:border-[#24211b] pb-2">
            {t('settingsTab.rulesSection.title', 'Online Booking Engine Logic Rules')}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.rulesSection.slotInterval', 'Time Slot Interval (Minutes)')}
              </label>
              <select
                value={formState.slot_interval_minutes}
                onChange={(e) => setFormState({ ...formState, slot_interval_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-amber-700 dark:text-[#e5c158] font-bold focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
              >
                <option value={15}>{t('settingsTab.rulesSection.intervalOption15', 'Every 15 Minutes')}</option>
                <option value={30}>{t('settingsTab.rulesSection.intervalOption30', 'Every 30 Minutes (Recommended)')}</option>
                <option value={45}>{t('settingsTab.rulesSection.intervalOption45', 'Every 45 Minutes')}</option>
                <option value={60}>{t('settingsTab.rulesSection.intervalOption60', 'Every 60 Minutes')}</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                {t('settingsTab.rulesSection.advanceNotice', 'Advance Booking Notice (Hours)')}
              </label>
              <input
                type="number"
                min={0}
                max={48}
                value={formState.booking_notice_hours}
                onChange={(e) => setFormState({ ...formState, booking_notice_hours: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-amber-700 dark:text-[#e5c158] font-bold focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 dark:text-[#736e62] mt-1">
                {t('settingsTab.rulesSection.advanceNoticeHelp', 'Prevents walk-in clients from booking a slot starting sooner than this notice window.')}
              </p>
            </div>
          </div>
        </div>

        {/* Reminder Settings Group */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-amber-600 dark:text-[#d4af37] font-serif border-b border-zinc-100 dark:border-[#24211b] pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('settingsTab.remindersSection.title', 'Appointment Reminders (No-Show Prevention)')}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.reminders_enabled ?? true}
                  onChange={(e) => setFormState({ ...formState, reminders_enabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-50 dark:bg-[#18181d] border border-zinc-300 dark:border-[#2e2a24] accent-amber-600 dark:accent-[#d4af37]"
                />
                <span className="text-zinc-700 dark:text-[#a39e91] font-semibold">
                  {t('settingsTab.remindersSection.enableReminders', 'Enable automated appointment reminders')}
                </span>
              </label>
              <p className="text-[10px] text-zinc-500 dark:text-[#736e62] mt-1 ml-6">
                {t('settingsTab.remindersSection.enableHelp', 'Send automatic SMS/Email reminders to reduce no-shows')}
              </p>
            </div>

            {formState.reminders_enabled !== false && (
              <>
                <div>
                  <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                    {t('settingsTab.remindersSection.reminderHours', 'Send Reminder (Hours Before Appointment)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={formState.reminder_hours_before ?? 2}
                    onChange={(e) => setFormState({ ...formState, reminder_hours_before: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-amber-700 dark:text-[#e5c158] font-bold focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                  />
                  <p className="text-[10px] text-zinc-500 dark:text-[#736e62] mt-1">
                    {t('settingsTab.remindersSection.reminderHoursHelp', 'Standard: 2 hours before')}
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-[#a39e91] font-semibold mb-1.5">
                    {t('settingsTab.remindersSection.reminderMethods', 'Reminder Methods')}
                  </label>
                  <select
                    value={formState.reminder_methods || 'email,sms'}
                    onChange={(e) => setFormState({ ...formState, reminder_methods: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-[#2e2a24] text-amber-700 dark:text-[#e5c158] font-bold focus:outline-none focus:border-amber-600 dark:focus:border-[#d4af37]"
                  >
                    <option value="email">{t('settingsTab.remindersSection.methodEmail', 'Email Only')}</option>
                    <option value="sms">{t('settingsTab.remindersSection.methodSMS', 'SMS Only')}</option>
                    <option value="email,sms">{t('settingsTab.remindersSection.methodBoth', 'Email + SMS (Recommended)')}</option>
                    <option value="whatsapp">{t('settingsTab.remindersSection.methodWhatsApp', 'WhatsApp Only')}</option>
                  </select>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1c1a16] border border-zinc-200 dark:border-[#2d2a24]">
                  <p className="text-[10px] text-zinc-600 dark:text-[#9c978b]">
                    {t('settingsTab.remindersSection.reminderNote', '💡 Setup Instructions: Reminders run every hour via edge function. For SMS/WhatsApp, set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your Supabase environment. Reminders are sent 2 hours before each appointment to all confirmed or pending bookings.')}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled
                    title="Requires a verified sending domain and Twilio/WhatsApp credentials — coming once those are connected."
                    className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#1c1a16] border border-zinc-300 dark:border-[#3a362e] text-zinc-400 dark:text-[#736e62] font-bold text-xs uppercase tracking-wider opacity-60 cursor-not-allowed flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {t('settingsTab.remindersSection.btnComingSoon', 'Coming Soon')}
                  </button>
                  <p className="text-[10px] text-zinc-500 dark:text-[#736e62] mt-1.5">
                    {t('settingsTab.remindersSection.comingSoonHelp', 'Reminder sending will be enabled once a verified email domain and SMS/WhatsApp provider are connected.')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form Submit */}
        <div className="pt-4 border-t border-zinc-100 dark:border-[#25221c] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-[#d4af37] dark:via-[#c59b27] dark:to-[#b8860b] text-white dark:text-[#0a0a0c] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving
              ? t('settingsTab.form.btnSaving', 'Saving...')
              : t('settingsTab.form.btnSave', 'Save All Settings')}
          </button>
        </div>

      </form>

      {/* Supabase Schema Helper Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#2e2922] space-y-4 shadow-sm dark:shadow-xl transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-amber-600 dark:text-[#d4af37]" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#f5f2eb] font-serif">
                {t('settingsTab.schemaSection.title', 'Supabase SQL Schema Script')}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-[#9c978b]">
                {t('settingsTab.schemaSection.subtitle', 'Run this script in Supabase SQL Editor if you ever provision a new project.')}
              </p>
            </div>
          </div>

          <button
            onClick={copySqlSchema}
            className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#1d1b17] border border-amber-600/40 dark:border-[#d4af37]/40 text-amber-700 dark:text-[#e5c158] hover:bg-zinc-100 dark:hover:bg-[#28251e] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            {copiedSql ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t('settingsTab.schemaSection.copied', 'Copied!')}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-4 h-4" />
                {t('settingsTab.schemaSection.btnCopy', 'Copy SQL Script')}
              </span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};