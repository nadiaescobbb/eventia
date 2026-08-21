import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityWithStats, RegistrationWithActivity } from '../types/events';
import { activitiesService } from '../lib/dataAccess/activitiesService';
import { registrationsService } from '../lib/dataAccess/registrationsService';
import { ActivityCard } from '../components/activities/ActivityCard';
import { Calendar, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Catalog: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationWithActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activitiesData = await activitiesService.getPublishedActivities();
      setActivities(activitiesData);

      if (user?.id) {
        const registrationsData = await registrationsService.getMyRegistrations(user.id);
        setMyRegistrations(registrationsData);
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Error al cargar actividades.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleRegister = async (activityId: string) => {
    if (!user?.id) return;
    setLoadingActionId(activityId);
    setAlert(null);

    try {
      await registrationsService.registerToActivity(activityId, user.id);
      setAlert({ type: 'success', message: '¡Inscripción realizada con éxito! Tu cupo ha sido reservado.' });
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'No fue posible realizar la inscripción.' });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    setLoadingActionId(registrationId);
    setAlert(null);

    try {
      await registrationsService.cancelRegistration(registrationId);
      setAlert({ type: 'success', message: 'Inscripción cancelada. El cupo ha sido liberado.' });
      await loadData();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'No fue posible cancelar la inscripción.' });
    } finally {
      setLoadingActionId(null);
    }
  };

  const getRegistrationIdForActivity = (activityId: string) => {
    return myRegistrations.find((r) => r.activity_id === activityId)?.id;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8 text-indigo-600" />
          <span>Catálogo de Actividades</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Explora los próximos eventos disponibles e inscríbete para asegurar tu plaza.
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
          <p className="text-sm font-medium">Cargando actividades disponibles...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No hay actividades publicadas</h3>
          <p className="text-sm text-slate-500">
            Vuelve a consultar más tarde para ver nuevos eventos organizados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => {
            const regId = getRegistrationIdForActivity(activity.id);
            const isReg = Boolean(regId);

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isRegistered={isReg}
                userRegistrationId={regId}
                isAdmin={isAdmin}
                onRegister={handleRegister}
                onCancelRegistration={handleCancelRegistration}
                isLoadingAction={loadingActionId === activity.id || loadingActionId === regId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
