export type UserRole = 'admin' | 'participant';

export type ActivityStatus = 'draft' | 'published' | 'cancelled';

export type RegistrationStatus = 'confirmed' | 'cancelled';

/**
 * Entidad de Usuario / Participante en la plataforma
 */
export interface Participant {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

/**
 * Entidad de Actividad / Evento
 */
export interface Activity {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  capacity: number;
  status: ActivityStatus;
  created_by?: string;
  created_at: string;
}

/**
 * Actividad con métricas de cupos calculadas en tiempo real (según BR-017)
 */
export interface ActivityWithStats extends Activity {
  confirmed_registrations_count: number;
  available_spots: number;
}

/**
 * Entidad de Inscripción
 */
export interface Registration {
  id: string;
  activity_id: string;
  participant_id: string;
  status?: RegistrationStatus;
  registered_at: string;
}

/**
 * Extensión de Inscripción con los detalles del evento asociado (para lista "Mis Inscripciones")
 */
export interface RegistrationWithActivity extends Registration {
  activity?: Activity;
}

/**
 * DTO para creación de nueva actividad (solo administradores)
 */
export interface NewActivityInput {
  title: string;
  description: string;
  event_date: string;
  location: string;
  capacity: number;
  status?: ActivityStatus;
}

/**
 * DTO para actualización de actividad (sujeto a BR-006)
 */
export interface UpdateActivityInput {
  title?: string;
  description?: string;
  event_date?: string;
  location?: string;
  capacity?: number;
  status?: ActivityStatus;
}
