import { supabase } from '../supabaseClient';
import { 
  Activity, 
  ActivityWithStats, 
  NewActivityInput, 
  UpdateActivityInput 
} from '../../types/events';
import { AppError, handleSupabaseError } from './errors';

export const activitiesService = {
  /**
   * Obtiene la lista de actividades publicadas calculando cupos vigentes (BR-017).
   */
  async getPublishedActivities(): Promise<ActivityWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          registrations (id)
        `)
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (error) throw handleSupabaseError(error);

      return (data || []).map((item: any) => {
        const confirmedCount = item.registrations?.length || 0;
        const availableSpots = Math.max(0, item.capacity - confirmedCount);
        const { registrations, ...activity } = item;

        return {
          ...activity,
          confirmed_registrations_count: confirmedCount,
          available_spots: availableSpots
        } as ActivityWithStats;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Obtiene el detalle completo de una actividad por su ID.
   */
  async getActivityById(id: string): Promise<ActivityWithStats> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          registrations (id)
        `)
        .eq('id', id)
        .single();

      if (error) throw handleSupabaseError(error);

      const confirmedCount = data.registrations?.length || 0;
      const availableSpots = Math.max(0, data.capacity - confirmedCount);
      const { registrations, ...activity } = data;

      return {
        ...activity,
        confirmed_registrations_count: confirmedCount,
        available_spots: availableSpots
      } as ActivityWithStats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Crea una nueva actividad (solo usuarios con rol Admin).
   */
  async createActivity(input: NewActivityInput, createdBy?: string): Promise<Activity> {
    try {
      if (input.capacity <= 0) {
        throw new AppError('CAPACIDAD_INVALIDA', 'El cupo máximo debe ser mayor a 0 (BR-011).');
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            title: input.title,
            description: input.description,
            event_date: input.event_date,
            location: input.location,
            capacity: input.capacity,
            status: input.status || 'draft',
            created_by: createdBy
          }
        ])
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data as Activity;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Actualiza una actividad existente validando restricción de capacidad (BR-006).
   */
  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    try {
      // Validación de regla BR-006: El cupo no puede reducirse por debajo de los inscriptos actuales
      if (input.capacity !== undefined) {
        const currentActivity = await this.getActivityById(id);
        if (input.capacity < currentActivity.confirmed_registrations_count) {
          throw new AppError(
            'CAPACIDAD_INVALIDA',
            `No se puede reducir el cupo a ${input.capacity} porque ya existen ${currentActivity.confirmed_registrations_count} inscriptos (BR-006).`
          );
        }
      }

      const { data, error } = await supabase
        .from('activities')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data as Activity;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Cambia el estado de una actividad a 'cancelled' (BR-015).
   */
  async cancelActivity(id: string): Promise<Activity> {
    return this.updateActivity(id, { status: 'cancelled' });
  }
};
