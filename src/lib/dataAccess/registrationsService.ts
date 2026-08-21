import { supabase } from '../supabaseClient';
import { Registration, RegistrationWithActivity, Participant } from '../../types/events';
import { AppError, handleSupabaseError } from './errors';
import { activitiesService } from './activitiesService';

export const registrationsService = {
  /**
   * Registra a un participante en una actividad respetando BR-001, BR-003 y BR-014.
   */
  async registerToActivity(activityId: string, participantId: string): Promise<Registration> {
    try {
      // 1. Verificación previa de cupos en el frontend (BR-001, BR-007)
      const activity = await activitiesService.getActivityById(activityId);
      
      if (activity.status !== 'published') {
        throw new AppError('EVENTO_NO_DISPONIBLE', 'La actividad no se encuentra publicada.');
      }

      if (activity.available_spots <= 0) {
        throw new AppError('CUPOS_AGOTADOS', 'Lo sentimos, la actividad ya no posee cupos disponibles (BR-001).');
      }

      // 2. Intento de inserción en Supabase (el trigger SQL check_capacity_before_registration y el UNIQUE constraint manejan la concurrencia BR-014 y duplica BR-003)
      const { data, error } = await supabase
        .from('registrations')
        .insert([
          {
            activity_id: activityId,
            participant_id: participantId
          }
        ])
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data as Registration;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Cancela una inscripción existente y libera el cupo de inmediato (BR-002, BR-005, BR-008).
   */
  async cancelRegistration(registrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Obtiene la lista de inscripciones del usuario autenticado actual.
   */
  async getMyRegistrations(participantId: string): Promise<RegistrationWithActivity[]> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          activity:activities (*)
        `)
        .eq('participant_id', participantId)
        .order('registered_at', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return (data || []) as RegistrationWithActivity[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  },

  /**
   * Obtiene el listado de participantes inscriptos en una actividad específica (solo vista Admin).
   */
  async getActivityParticipants(activityId: string): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          participant:participants (*)
        `)
        .eq('activity_id', activityId);

      if (error) throw handleSupabaseError(error);

      return (data || [])
        .map((item: any) => item.participant)
        .filter(Boolean) as Participant[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleSupabaseError(error);
    }
  }
};
