-- =============================================================================
-- SCRIPT DE MIGRACIÓN PARA PROYECTO SUPABASE: EVENTIA
-- Base de Datos PostgreSQL
-- Proyecto Supabase ID: izwlzlbjjxpqrctvcyfu
-- =============================================================================

-- 1. Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla de participantes (Perfil extendido asociado a auth.users)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'participant')) DEFAULT 'participant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Crear tabla de actividades (Eventos gestionados por administradores)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')) DEFAULT 'draft',
  created_by UUID REFERENCES public.participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Crear tabla de inscripciones (Inscripciones de participantes en actividades)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_activity_participant UNIQUE (activity_id, participant_id)
);

-- 5. Crear índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_activities_status_date ON public.activities(status, event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_activity_id ON public.registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_registrations_participant_id ON public.registrations(participant_id);

-- 6. Función y Trigger: Control estricto de cupos antes de insertar inscripción (BR-001, BR-007, BR-014)
CREATE OR REPLACE FUNCTION public.check_capacity_before_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
  v_current INT;
  v_status TEXT;
BEGIN
  SELECT capacity, status INTO v_capacity, v_status FROM public.activities WHERE id = NEW.activity_id;
  
  IF v_status != 'published' THEN
    RAISE EXCEPTION 'No es posible inscribirse a una actividad no publicada.';
  END IF;

  SELECT COUNT(*) INTO v_current FROM public.registrations WHERE activity_id = NEW.activity_id;

  IF v_current >= v_capacity THEN
    RAISE EXCEPTION 'La actividad ha alcanzado su capacidad máxima de cupos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_capacity ON public.registrations;
CREATE TRIGGER trg_check_capacity
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_capacity_before_registration();

-- 7. Función y Trigger: Creación automática del perfil en participants tras Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.participants (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
  )
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Habilitar Row Level Security (RLS)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para participants
DROP POLICY IF EXISTS "Perfil visible para usuarios autenticados" ON public.participants;
CREATE POLICY "Perfil visible para usuarios autenticados" 
  ON public.participants FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.participants;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.participants FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 10. Políticas RLS para activities
DROP POLICY IF EXISTS "Lectura de actividades segun rol" ON public.activities;
CREATE POLICY "Lectura de actividades segun rol" 
  ON public.activities FOR SELECT TO authenticated USING (
    status = 'published' OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins gestionan actividades" ON public.activities;
CREATE POLICY "Admins gestionan actividades" 
  ON public.activities FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

-- 11. Políticas RLS para registrations
DROP POLICY IF EXISTS "Lectura de inscripciones" ON public.registrations;
CREATE POLICY "Lectura de inscripciones" 
  ON public.registrations FOR SELECT TO authenticated USING (
    participant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Crear inscripcion propia" ON public.registrations;
CREATE POLICY "Crear inscripcion propia" 
  ON public.registrations FOR INSERT TO authenticated WITH CHECK (
    participant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Cancelar inscripcion propia o admin" ON public.registrations;
CREATE POLICY "Cancelar inscripcion propia o admin" 
  ON public.registrations FOR DELETE TO authenticated USING (
    participant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );
