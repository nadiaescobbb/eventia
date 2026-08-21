import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityWithStats, NewActivityInput } from '../types/events';
import { activitiesService } from '../lib/dataAccess/activitiesService';
import { ActivityCard } from '../components/activities/ActivityCard';
import { ActivityFormModal } from '../components/activities/ActivityFormModal';
import { AttendeeListModal } from '../components/activities/AttendeeListModal';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { Shield, Plus, Loader2, Calendar, Users, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityWithStats | null>(null);
  const [inspectingActivity, setInspectingActivity] = useState<ActivityWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadAllActivities = async () => {
    setIsLoading(true);
    try {
      const data = await activitiesService.getPublishedActivities();
      setActivities(data);
    } catch (err: any) {
      addToast('error', 'Error de Carga', err.message || 'Error al obtener la lista de actividades.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllActivities();
  }, []);

  // Métricas Globales de Cabecera
  const totalEvents = activities.length;
  const publishedEvents = activities.filter((a) => a.status === 'published').length;
  const totalRegistrations = activities.reduce((acc, curr) => acc + curr.confirmed_registrations_count, 0);
  const totalCapacity = activities.reduce((acc, curr) => acc + curr.capacity, 0);
  const globalOccupancyRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

  const handleCreateOrUpdate = async (input: NewActivityInput) => {
    setIsSubmitting(true);

    try {
      if (editingActivity) {
        await activitiesService.updateActivity(editingActivity.id, input);
        addToast('success', 'Actividad Actualizada', 'Los datos del evento han sido modificados.');
      } else {
        await activitiesService.createActivity(input, user?.id);
        addToast('success', 'Actividad Creada', 'Nueva actividad registrada en borrador.');
      }
      await loadAllActivities();
      setIsFormModalOpen(false);
      setEditingActivity(null);
    } catch (err: any) {
      addToast('error', 'Error al Guardar', err.message || 'No fue posible guardar la actividad (BR-006/BR-011).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (activityId: string, newStatus: 'published' | 'cancelled') => {
    try {
      await activitiesService.updateActivity(activityId, { status: newStatus });
      addToast('info', 'Estado Modificado', `Actividad actualizada a estado ${newStatus}.`);
      await loadAllActivities();
    } catch (err: any) {
      addToast('error', 'Error de Estado', err.message || 'No fue posible cambiar el estado de la actividad.');
    }
  };

  const openCreateModal = () => {
    setEditingActivity(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (act: ActivityWithStats) => {
    setEditingActivity(act);
    setIsFormModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600" />
            <span>Panel de Administración</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consola centralizada para métricas, gestión de cupos y publicación de eventos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* Tarjetas KPI de Métricas de Cabecera */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Eventos Publicados</p>
            <h3 className="text-2xl font-bold text-slate-900">{publishedEvents} <span className="text-sm font-normal text-slate-400">/ {totalEvents}</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inscriptos Confirmados</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalRegistrations} <span className="text-sm font-normal text-slate-400">participantes</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tasa Ocupación Global</p>
            <h3 className="text-2xl font-bold text-slate-900">{globalOccupancyRate}%</h3>
          </div>
        </div>
      </div>

      {/* Selector de Vista: Grilla o Tabla */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">Listado de Actividades</h2>
        <div className="flex items-center space-x-2 bg-slate-200/60 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Grilla
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Tabla
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Cargando consola de administración...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No hay actividades registradas</h3>
          <p className="text-sm text-slate-500 mb-6">
            Haz clic en "Nueva Actividad" para crear el primer evento en la plataforma.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Crear actividad inicial</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isAdmin={true}
              onEdit={openEditModal}
              onViewAttendees={(act) => setInspectingActivity(act)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        /* Vista de Tabla Admin */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ocupación de Cupos
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{act.title}</div>
                    <div className="text-xs text-slate-500">{act.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        act.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.status === 'draft'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {act.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {act.confirmed_registrations_count} / {act.capacity} ({act.available_spots} disponibles)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => setInspectingActivity(act)}
                      className="text-slate-600 hover:text-indigo-600 text-xs px-2 py-1 bg-slate-100 rounded"
                    >
                      Ver Inscriptos ({act.confirmed_registrations_count})
                    </button>
                    <button
                      onClick={() => openEditModal(act)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs px-2 py-1 bg-indigo-50 rounded"
                    >
                      Editar
                    </button>
                    {act.status === 'published' && (
                      <button
                        onClick={() => handleToggleStatus(act.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1 bg-red-50 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Formulario */}
      <ActivityFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingActivity}
        isSubmitting={isSubmitting}
      />

      {/* Modal de Nómina de Asistentes */}
      <AttendeeListModal
        isOpen={Boolean(inspectingActivity)}
        onClose={() => setInspectingActivity(null)}
        activity={inspectingActivity}
      />
    </div>
  );
};
