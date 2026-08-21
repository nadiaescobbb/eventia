export type ErrorCode = 
  | 'CUPOS_AGOTADOS'
  | 'YA_INSCRIPTO'
  | 'EVENTO_NO_DISPONIBLE'
  | 'CAPACIDAD_INVALIDA'
  | 'PERMISO_DENEGADO'
  | 'NO_AUTENTICADO'
  | 'REGISTRO_NO_ENCONTRADO'
  | 'ERROR_DESCONOCIDO';

export class AppError extends Error {
  public code: ErrorCode;
  public originalError?: unknown;

  constructor(code: ErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Mapea errores nativos de PostgreSQL / Supabase a códigos de error estandarizados y semánticos.
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) return new AppError('ERROR_DESCONOCIDO', 'Ocurrió un error inesperado.');

  const message = error.message || String(error);
  const code = error.code || '';

  // 1. Error de unicidad (BR-003): Ya inscripto
  if (code === '23505' || message.includes('unique_activity_participant') || message.includes('duplicate key')) {
    return new AppError(
      'YA_INSCRIPTO',
      'Ya te encuentras inscripto en esta actividad.',
      error
    );
  }

  // 2. Error del Trigger de Capacidad Máxima (BR-001, BR-007, BR-014)
  if (message.includes('capacidad máxima') || message.includes('alcanzado su capacidad')) {
    return new AppError(
      'CUPOS_AGOTADOS',
      'Lo sentimos, la actividad ha alcanzado el límite máximo de cupos.',
      error
    );
  }

  // 3. Intento de inscripción en actividad no publicada
  if (message.includes('no publicada')) {
    return new AppError(
      'EVENTO_NO_DISPONIBLE',
      'La actividad seleccionada no se encuentra disponible para inscripción.',
      error
    );
  }

  // 4. Errores de Políticas de Seguridad RLS / Permisos
  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return new AppError(
      'PERMISO_DENEGADO',
      'No posees los permisos necesarios para realizar esta acción.',
      error
    );
  }

  return new AppError('ERROR_DESCONOCIDO', message || 'Ocurrió un error en el servidor.', error);
}
