import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegistrationWithActivity } from '../types/events';
import { registrationsService } from '../lib/dataAccess/registrationsService';
import { BookmarkCheck, Calendar, MapPin, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const MyRegistrations: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationWithActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRegistrations = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await registrationsService.getMyRegistrations(user.id);
      setRegistrations(data);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar tus inscripciones.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [user?.id]);

  const handleCancel = async (registrationId: string) => {
    setCancellingId(registrationId);
    setAlert(null);

    try {
      await registrationsService.cancelRegistration(registrationId);
      setAlert({ type: 'success', message: 'Inscripción cancelada correctamente. El cupo fue liberado.' });
      await loadRegistrations();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'No fue posible cancelar la inscripción.' });
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BookmarkCheck className="h-8 w-8 text-indigo-600" />
          <span>Mis Inscripciones</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulta y gestiona las actividades a las que te encuentras anotado actualmente.
        </p>
      </div>

      {alert && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 shadow-sm border ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Cargando tus inscripciones...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <BookmarkCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Aún no estás inscripto en ninguna actividad</h3>
          <p className="text-sm text-slate-500 mb-6">
            Explora el catálogo principal para reservar tu plaza en los eventos de tu interés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((item) => {
            const act = item.activity;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {act?.title || 'Actividad Sin Título'}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {act?.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{formatDate(act?.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{act?.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleCancel(item.id)}
                    disabled={cancellingId === item.id}
                    className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>{cancellingId === item.id ? 'Cancelando...' : 'Cancelar inscripción'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
