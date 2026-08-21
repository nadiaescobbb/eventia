import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityWithStats, RegistrationWithActivity } from '../types/events';
import { activitiesService } from '../lib/dataAccess/activitiesService';
import { registrationsService } from '../lib/dataAccess/registrationsService';
import { ActivityCard } from '../components/activities/ActivityCard';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { Calendar, Search, Loader2, Filter } from 'lucide-react';

export const ActivitiesCatalog: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationWithActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'full'>('all');

  // Sistema de Toast Feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      addToast('error', 'Error al cargar catálogo', err.message || 'No fue posible consultar las actividades.');
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

    try {
      await registrationsService.registerToActivity(activityId, user.id);
      addToast('success', '¡Inscripción Confirmada!', 'Tu reserva ha sido registrada correctamente.');
      await loadData();
    } catch (err: any) {
      addToast('error', 'Error en Inscripción', err.message || 'No fue posible registrar tu cupo (BR-014/BR-001).');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    setLoadingActionId(registrationId);

    try {
      await registrationsService.cancelRegistration(registrationId);
      addToast('info', 'Inscripción Cancelada', 'El cupo ha sido liberado de inmediato para otros usuarios (BR-002).');
      await loadData();
    } catch (err: any) {
      addToast('error', 'Error al Cancelar', err.message || 'No fue posible procesar la cancelación.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const getRegistrationIdForActivity = (activityId: string) => {
    return myRegistrations.find((r) => r.activity_id === activityId)?.id;
  };

  // Filtrado dinámico
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'available') return act.available_spots > 0;
    if (statusFilter === 'full') return act.available_spots <= 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <span>Catálogo de Actividades</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Explora los próximos eventos disponibles e inscríbete para asegurar tu plaza.
          </p>
        </div>

        {/* Buscador y Filtros Rápidos */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar evento o lugar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 ml-2 hidden sm:block" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setStatusFilter('full')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'full'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agotadas
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Cargando catálogo de actividades...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No se encontraron actividades</h3>
          <p className="text-sm text-slate-500">
            Intenta cambiar el término de búsqueda o restablecer los filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
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
