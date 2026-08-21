import React from 'react';
import { MapPin, Users, CheckCircle, XCircle, Clock, ShieldAlert, Check } from 'lucide-react';
import { ActivityWithStats } from '../../types/events';

interface ActivityCardProps {
  activity: ActivityWithStats;
  isRegistered?: boolean;
  userRegistrationId?: string;
  isAdmin?: boolean;
  onRegister?: (activityId: string) => void;
  onCancelRegistration?: (registrationId: string) => void;
  onEdit?: (activity: ActivityWithStats) => void;
  onViewAttendees?: (activity: ActivityWithStats) => void;
  onToggleStatus?: (activityId: string, newStatus: 'published' | 'cancelled') => void;
  isLoadingAction?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isRegistered = false,
  userRegistrationId,
  isAdmin = false,
  onRegister,
  onCancelRegistration,
  onEdit,
  onViewAttendees,
  onToggleStatus,
  isLoadingAction = false,
}) => {
  const isFull = activity.available_spots <= 0;
  const occupancyPercentage = Math.min(
    100,
    Math.round((activity.confirmed_registrations_count / activity.capacity) * 100)
  );

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {activity.title}
          </h3>

          {/* Badge de Estado con Contraste Suave */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                activity.status === 'published'
                  ? isFull
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : activity.status === 'draft'
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {activity.status === 'published'
                ? isFull
                  ? 'Agotado'
                  : 'Disponible'
                : activity.status === 'draft'
                ? 'Borrador'
                : 'Cancelado'}
            </span>

            {isRegistered && !isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Check className="h-3 w-3" />
                <span>Ya inscripto</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
          {activity.description}
        </p>

        <div className="space-y-2.5 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="capitalize">{formatDate(activity.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span>{activity.location}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Users className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span>
                {activity.confirmed_registrations_count} / {activity.capacity} cupos
              </span>
            </div>
            <span className="text-slate-400 font-semibold">
              {activity.available_spots} disponibles (BR-017)
            </span>
          </div>
        </div>

        {/* Barra Visual de Ocupación de Cupos */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              occupancyPercentage >= 100
                ? 'bg-rose-500'
                : occupancyPercentage >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>

      {/* Acciones Dinámicas */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2 w-full justify-end">
            <button
              onClick={() => onViewAttendees?.(activity)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Inscriptos ({activity.confirmed_registrations_count})
            </button>
            <button
              onClick={() => onEdit?.(activity)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Editar
            </button>
            {activity.status === 'draft' && (
              <button
                onClick={() => onToggleStatus?.(activity.id, 'published')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Publicar
              </button>
            )}
          </div>
        ) : (
          <div className="w-full">
            {isRegistered ? (
              <button
                onClick={() => userRegistrationId && onCancelRegistration?.(userRegistrationId)}
                disabled={isLoadingAction}
                className="w-full py-2 px-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                <span>Cancelar inscripción (BR-005)</span>
              </button>
            ) : isFull ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-slate-200 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Cupos Agotados</span>
              </button>
            ) : (
              <button
                onClick={() => onRegister?.(activity.id)}
                disabled={isLoadingAction}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Inscribirme ahora</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
