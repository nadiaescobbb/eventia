import React, { useEffect, useState } from 'react';
import { X, Users, Mail, UserCheck, Loader2 } from 'lucide-react';
import { ActivityWithStats, Participant } from '../../types/events';
import { registrationsService } from '../../lib/dataAccess/registrationsService';

interface AttendeeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityWithStats | null;
}

export const AttendeeListModal: React.FC<AttendeeListModalProps> = ({
  isOpen,
  onClose,
  activity,
}) => {
  const [attendees, setAttendees] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activity) {
      setIsLoading(true);
      setError(null);
      registrationsService
        .getActivityParticipants(activity.id)
        .then((data) => setAttendees(data))
        .catch((err) => setError(err.message || 'Error al cargar la lista de asistentes.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, activity]);

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{activity.title}</h3>
            <p className="text-xs text-slate-500">
              Asistentes inscriptos ({activity.confirmed_registrations_count} / {activity.capacity})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm">Cargando asistentes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Aún no hay participantes inscriptos en esta actividad.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attendees.map((attendee) => (
                <li key={attendee.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {attendee.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {attendee.full_name || 'Usuario'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="h-3 w-3" />
                        <span>{attendee.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <UserCheck className="h-3 w-3" />
                    <span>Inscripto</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
