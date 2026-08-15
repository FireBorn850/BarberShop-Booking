import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  FileText,
  Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Appointment, AppointmentStatus } from '../../types';
import { format } from 'date-fns';
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface AppointmentsTabProps {
  appointments: Appointment[];
  onUpdateStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  onUpdateStatus,
}) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNotes, setSelectedNotes] = useState<string | null>(null);

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
    return t('appointmentsTab.walkInClient', 'Walk-in Client');
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    const translatedServiceName = app.service?.name ? getTranslatedServiceName(app.service.name) : '';
    const walkInClient = getTranslatedWalkIn();

    const matchesSearch =
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm) ||
      translatedServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      walkInClient.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> {t('appointmentsTab.statusConfirmed', 'Confirmed')}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> {t('appointmentsTab.statusCompleted', 'Completed')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-400 text-xs font-semibold flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> {t('appointmentsTab.statusCancelled', 'Cancelled')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> {t('appointmentsTab.statusPending', 'Pending')}
          </span>
        );
    }
  };

  const statusFilterKeys: Record<string, string> = {
    all: t('appointmentsTab.filterAll', 'All'),
    pending: t('appointmentsTab.filterPending', 'Pending'),
    confirmed: t('appointmentsTab.filterConfirmed', 'Confirmed'),
    completed: t('appointmentsTab.filterCompleted', 'Completed'),
    cancelled: t('appointmentsTab.filterCancelled', 'Cancelled'),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-stone-800">
        <div>
          <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-stone-100">
            {t('appointmentsTab.title', 'Appointments Directory')}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-stone-400">
            {t('appointmentsTab.subtitle', 'Manage client schedule, review bookings, and update statuses')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 dark:text-stone-400 font-semibold">
            {t('appointmentsTab.totalFiltered', 'Total Filtered:')} {filteredAppointments.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 shadow-sm transition-colors duration-300">

        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('appointmentsTab.searchPlaceholder', 'Search by client name, email, phone, or service...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-xs focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${statusFilter === st
                  ? 'bg-amber-600 text-black font-bold shadow-md'
                  : 'bg-zinc-100 dark:bg-[#0A0A0A] text-zinc-600 dark:text-stone-400 border border-zinc-200 dark:border-stone-800 hover:text-zinc-900 dark:hover:text-stone-100'
                }`}
            >
              {statusFilterKeys[st] || st}
            </button>
          ))}
        </div>

      </div>

      {/* Appointments List / Table */}
      {filteredAppointments.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 text-zinc-500 dark:text-stone-400 space-y-2 shadow-sm">
          <Calendar className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto opacity-50" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-stone-100">
            {t('appointmentsTab.noAppointmentsTitle', 'No Matching Appointments Found')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-stone-500">
            {t('appointmentsTab.noAppointmentsSub', 'Try adjusting your search query or status filter above.')}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 overflow-hidden shadow-xl transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-stone-300">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 dark:text-stone-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-stone-800">
                <tr>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colClient', 'Client')}</th>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colService', 'Service')}</th>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colBarber', 'Barber')}</th>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colDateSlot', 'Date & Slot')}</th>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colStatus', 'Status')}</th>
                  <th className="py-3.5 px-4">{t('appointmentsTab.colNotes', 'Notes')}</th>
                  <th className="py-3.5 px-4 text-right">{t('appointmentsTab.colUpdateStatus', 'Update Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-stone-800/80">
                {filteredAppointments.map((app) => {
                  const translatedServiceName = app.service?.name
                    ? getTranslatedServiceName(app.service.name)
                    : t('appointmentsTab.defaultServiceName', 'Barber Service');

                  return (
                    <tr key={app.id} className="hover:bg-zinc-50 dark:hover:bg-[#0A0A0A]/60 transition-colors">

                      {/* Client Info */}
                      <td className="py-4 px-4 font-medium">
                        <div className="font-bold text-zinc-900 dark:text-stone-100 text-sm">{app.full_name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-stone-400 flex flex-col gap-0.5 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {app.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {app.email}
                          </span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-900 dark:text-stone-100">
                          {translatedServiceName}
                        </div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-500 font-serif font-bold mt-0.5">
                          {formatPrice(app.service?.price || 0)} ({app.service?.duration_minutes || 30} {t('appointmentsTab.mins', 'mins')})
                        </div>
                      </td>

                      {/* Barber */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-900 dark:text-stone-100">
                          {app.barber?.full_name || t('appointmentsTab.anyBarber', 'Any Available')}
                        </div>
                        {app.barber?.role && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                            {app.barber.role}
                          </div>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-900 dark:text-stone-100">
                          {format(new Date(app.appointment_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </div>
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-500 font-semibold mt-0.5">
                          {app.start_time} - {app.end_time}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-4">
                        {app.notes ? (
                          <button
                            onClick={() => setSelectedNotes(app.notes || '')}
                            className="text-[11px] text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1 max-w-[140px] truncate cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{app.notes}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-400 dark:text-stone-600 italic">
                            {t('appointmentsTab.noNotes', 'None')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status !== 'confirmed' && (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'confirmed')}
                              className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-800 border border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                              title={t('appointmentsTab.titleConfirm', 'Confirm Appointment')}
                            >
                              {t('appointmentsTab.btnConfirm', 'Confirm')}
                            </button>
                          )}

                          {app.status !== 'completed' && (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'completed')}
                              className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950/80 hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-300 dark:border-blue-700/80 text-blue-800 dark:text-blue-300 text-[11px] font-bold transition-all cursor-pointer"
                              title={t('appointmentsTab.titleComplete', 'Mark Completed')}
                            >
                              {t('appointmentsTab.btnComplete', 'Complete')}
                            </button>
                          )}

                          {app.status !== 'cancelled' && (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-800 border border-red-300 dark:border-red-700/80 text-red-800 dark:text-red-300 text-[11px] font-bold transition-all cursor-pointer"
                              title={t('appointmentsTab.titleCancel', 'Cancel Appointment')}
                            >
                              {t('appointmentsTab.btnCancel', 'Cancel')}
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {selectedNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-stone-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold font-serif text-zinc-900 dark:text-stone-100">
              {t('appointmentsTab.modalTitle', 'Client Notes')}
            </h4>
            <p className="text-sm text-zinc-700 dark:text-stone-300 bg-zinc-50 dark:bg-[#18181d] p-4 rounded-lg border border-zinc-200 dark:border-stone-800 whitespace-pre-wrap">
              {selectedNotes}
            </p>
            <div className="text-right">
              <button
                onClick={() => setSelectedNotes(null)}
                className="px-5 py-2 rounded-lg bg-amber-600 text-black font-bold text-xs uppercase cursor-pointer hover:bg-amber-500 transition-colors"
              >
                {t('appointmentsTab.modalClose', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};