import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Appointment, AppointmentStatus } from '../../types';
import { getShopNow } from '../../lib/availability';

interface ClientsTabProps {
  appointments: Appointment[];
}

interface ClientRecord {
  key: string;
  fullName: string;
  email: string;
  phone: string;
  isWalkIn: boolean;
  appointments: Appointment[]; // sorted most-recent-first
  totalVisits: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  lastVisitDate: string; // YYYY-MM-DD of most recent appointment (any status)
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ appointments }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);

  const getTranslatedServiceName = (serviceName?: string): string => {
    if (!serviceName) return t('appointmentsTab.defaultServiceName', 'Barber Service');
    const translatedName = t(`serviceNames.${serviceName}`, '');
    if (translatedName && translatedName !== `serviceNames.${serviceName}`) {
      return translatedName;
    }
    return serviceName;
  };

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

  // Groups every appointment into a per-client record. Real customers are
  // grouped by email; walk-ins (placeholder @shop.local email) are grouped
  // by phone instead so repeat walk-in customers still merge correctly.
  const getClientKey = (app: Appointment): string => {
    const email = (app.email || '').trim().toLowerCase();
    if (email && !email.endsWith('@shop.local')) return `email:${email}`;
    const phone = (app.phone || '').trim();
    if (phone) return `phone:${phone}`;
    return `unique:${app.id}`;
  };

  const todayStr = format(getShopNow(), 'yyyy-MM-dd');

  const clients = useMemo<ClientRecord[]>(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach((app) => {
      const key = getClientKey(app);
      const list = map.get(key) || [];
      list.push(app);
      map.set(key, list);
    });

    const records: ClientRecord[] = [];

    map.forEach((apps, key) => {
      const sorted = [...apps].sort((a, b) => {
        const aKey = `${a.appointment_date}T${a.start_time}`;
        const bKey = `${b.appointment_date}T${b.start_time}`;
        return bKey.localeCompare(aKey);
      });

      const mostRecent = sorted[0];
      const isWalkIn = (mostRecent.email || '').toLowerCase().endsWith('@shop.local');

      records.push({
        key,
        fullName: mostRecent.full_name,
        email: mostRecent.email,
        phone: mostRecent.phone,
        isWalkIn,
        appointments: sorted,
        totalVisits: sorted.length,
        completed: sorted.filter((a) => a.status === 'completed').length,
        cancelled: sorted.filter((a) => a.status === 'cancelled').length,
        upcoming: sorted.filter(
          (a) => (a.status === 'pending' || a.status === 'confirmed') && a.appointment_date >= todayStr
        ).length,
        lastVisitDate: mostRecent.appointment_date,
      });
    });

    return records.sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate));
  }, [appointments, todayStr]);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(searchTerm)
    );
  });

  const selectedClient = selectedClientKey
    ? clients.find((c) => c.key === selectedClientKey) || null
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-stone-800">
        <div>
          <h2 className="text-2xl font-bold font-serif text-zinc-900 dark:text-stone-100">
            {t('clientsTab.title', 'Clients Directory')}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-stone-400">
            {t('clientsTab.subtitle', 'Every client derived from booking history — visit counts, cancellations, and upcoming appointments.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 dark:text-stone-400 font-semibold">
            {t('clientsTab.totalFiltered', 'Total Clients:')} {filteredClients.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 shadow-sm transition-colors duration-300">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('clientsTab.searchPlaceholder', 'Search by client name, email, or phone...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-zinc-900 dark:text-stone-100 placeholder-zinc-400 dark:placeholder-stone-600 text-xs focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 text-zinc-500 dark:text-stone-400 space-y-2 shadow-sm">
          <Users className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto opacity-50" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-stone-100">
            {t('clientsTab.noClientsTitle', 'No Matching Clients Found')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-stone-500">
            {t('clientsTab.noClientsSub', 'Try adjusting your search query above.')}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#0C0C0C] border border-zinc-200 dark:border-stone-800 overflow-hidden shadow-xl transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-stone-300">
              <thead className="bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-500 dark:text-stone-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-stone-800">
                <tr>
                  <th className="py-3.5 px-4">{t('clientsTab.colClient', 'Client')}</th>
                  <th className="py-3.5 px-4 text-center">{t('clientsTab.colTotalVisits', 'Total Visits')}</th>
                  <th className="py-3.5 px-4 text-center">{t('clientsTab.colCompleted', 'Completed')}</th>
                  <th className="py-3.5 px-4 text-center">{t('clientsTab.colCancelled', 'Cancelled')}</th>
                  <th className="py-3.5 px-4 text-center">{t('clientsTab.colUpcoming', 'Upcoming')}</th>
                  <th className="py-3.5 px-4">{t('clientsTab.colLastVisit', 'Last Activity')}</th>
                  <th className="py-3.5 px-4 text-right">{t('clientsTab.colHistory', 'History')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-stone-800/80">
                {filteredClients.map((client) => (
                  <tr key={client.key} className="hover:bg-zinc-50 dark:hover:bg-[#0A0A0A]/60 transition-colors">
                    <td className="py-4 px-4 font-medium">
                      <div className="font-bold text-zinc-900 dark:text-stone-100 text-sm flex items-center gap-2">
                        {client.fullName}
                        {client.isWalkIn && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-stone-800 text-zinc-500 dark:text-stone-400 border border-zinc-200 dark:border-stone-700">
                            {t('clientsTab.walkInBadge', 'Walk-in')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-stone-400 flex flex-col gap-0.5 mt-0.5">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {client.phone}
                          </span>
                        )}
                        {!client.isWalkIn && client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {client.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-zinc-900 dark:text-stone-100">
                      {client.totalVisits}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                      {client.completed}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-red-700 dark:text-red-400">
                      {client.cancelled}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-amber-700 dark:text-amber-500">
                      {client.upcoming}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-zinc-900 dark:text-stone-100">
                        {format(new Date(client.lastVisitDate + 'T00:00:00'), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedClientKey(client.key)}
                        className="px-3 py-1.5 rounded bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-800 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {t('clientsTab.btnViewHistory', 'View')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client History Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-stone-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-bold font-serif text-zinc-900 dark:text-stone-100">
                  {selectedClient.fullName}
                </h4>
                <div className="text-[11px] text-zinc-500 dark:text-stone-400 flex flex-col gap-0.5 mt-1">
                  {selectedClient.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {selectedClient.phone}
                    </span>
                  )}
                  {!selectedClient.isWalkIn && selectedClient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-600 dark:text-amber-500" /> {selectedClient.email}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedClientKey(null)}
                className="p-1.5 rounded-sm hover:bg-zinc-100 dark:hover:bg-stone-800 text-zinc-500 dark:text-stone-400 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedClient.appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-[#18181d] border border-zinc-200 dark:border-stone-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-stone-100 text-sm">
                      {getTranslatedServiceName(app.service?.name)}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-stone-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                      {format(new Date(app.appointment_date + 'T00:00:00'), 'MMM d, yyyy')}
                    </span>
                    <span className="font-mono">{app.start_time} - {app.end_time}</span>
                  </div>
                  {app.notes && (
                    <div className="text-[11px] text-zinc-500 dark:text-stone-500 flex items-start gap-1 pt-1 border-t border-zinc-200 dark:border-stone-800/80">
                      <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="italic">{app.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};