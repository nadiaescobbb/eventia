# Especificación Técnica: Plataforma de Gestión de Actividades y Eventos (Eventia)

El presente documento define la arquitectura de software, modelado de datos en Supabase (PostgreSQL), políticas de seguridad (RLS), script SQL de migración y estructura del proyecto en React + Vite + Tailwind CSS. 

Fue elaborado exclusivamente a partir de los documentos [product-brief.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/product-brief.md) y [business-rules.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/business-rules.md).

---

## 🏗️ 1. Arquitectura Propuesta

La solución está estructurada como una **Single Page Application (SPA)** client-side, desacoplada de la infraestructura subyacente de base de datos mediante un patrón de repositorio/acceso a datos en el frontend.

```
[ Frontend: React + Vite + Tailwind CSS ]
                  │
                  ▼ (Llamadas desacopladas via Repositorio/Abstracción)
         [ Módulo DataAccess ]
                  │
                  ▼ (@supabase/supabase-js Client)
    [ Supabase PostgreSQL + Auth Engine ] (Project ID: izwlzlbjjxpqrctvcyfu)
```

* **Frontend**: React.js inicializado con Vite, estilizado con Tailwind CSS.
* **Acceso a Datos**: `@supabase/supabase-js` consumido **exclusivamente** desde un módulo propio (`src/lib/dataAccess`), abstrayendo las llamadas directas de la capa de componentes UI. No se expone una API REST intermedia propia.
* **Seguridad & Autenticación**: Supabase Auth integrado con políticas de **Row Level Security (RLS)** a nivel de base de datos.

---

## 🗄️ 2. Entidades, Relaciones y Restricciones

### Entidad: `participants`
Almacena la información del perfil público de los usuarios asociados a `auth.users`.
* `id` (`UUID`, Primary Key, References `auth.users(id)` ON DELETE CASCADE)
* `email` (`TEXT`, NOT NULL, UNIQUE)
* `full_name` (`TEXT`, NOT NULL)
* `role` (`TEXT`, NOT NULL, CHECK `role IN ('admin', 'participant')`, DEFAULT `'participant'`)
* `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

### Entidad: `activities`
Representa los eventos o actividades creados en la plataforma.
* `id` (`UUID`, Primary Key, DEFAULT `gen_random_uuid()`)
* `title` (`TEXT`, NOT NULL)
* `description` (`TEXT`, NOT NULL)
* `event_date` (`TIMESTAMPTZ`, NOT NULL)
* `location` (`TEXT`, NOT NULL)
* `capacity` (`INTEGER`, NOT NULL, CHECK `capacity > 0`)
* `status` (`TEXT`, NOT NULL, CHECK `status IN ('draft', 'published', 'cancelled')`, DEFAULT `'draft'`)
* `created_by` (`UUID`, References `participants(id)`)
* `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

### Entidad: `registrations`
Representa la reserva/inscripción efectiva de un participante en una actividad.
* `id` (`UUID`, Primary Key, DEFAULT `gen_random_uuid()`)
* `activity_id` (`UUID`, NOT NULL, References `activities(id)` ON DELETE CASCADE)
* `participant_id` (`UUID`, NOT NULL, References `participants(id)` ON DELETE CASCADE)
* `registered_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)
* **Restricción de Unicidad**: `UNIQUE(activity_id, participant_id)` (Satisface BR-003)

---

## 📜 3. Script SQL para Ejecutar vía MCP de Supabase

Este script creará las tablas, índices, vistas de ocupación, triggers y políticas RLS necesarias.

```sql
-- 1. Crear tabla de participantes integrada con Supabase Auth
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'participant')) DEFAULT 'participant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Crear tabla de actividades
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

-- 3. Crear tabla de inscripciones
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_activity_participant UNIQUE (activity_id, participant_id)
);

-- 4. Índices para optimización de consultas de cupos e inscripciones
CREATE INDEX IF NOT EXISTS idx_activities_status_date ON public.activities(status, event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_activity_id ON public.registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_registrations_participant_id ON public.registrations(participant_id);

-- 5. Vista de Ocupación en Tiempo Real (Cumple BR-017)
CREATE OR REPLACE VIEW public.v_activity_occupancy AS
SELECT 
  a.id AS activity_id,
  a.title,
  a.capacity,
  COUNT(r.id)::INT AS current_registrations,
  (a.capacity - COUNT(r.id)::INT) AS available_spots
FROM public.activities a
LEFT JOIN public.registrations r ON a.id = r.activity_id
GROUP BY a.id, a.title, a.capacity;

-- 6. Trigger para validación de cupo máximo antes de insertar inscripción (Cumple BR-001, BR-007, BR-014)
CREATE OR REPLACE FUNCTION public.check_capacity_before_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
  v_current INT;
  v_status TEXT;
BEGIN
  -- Obtener capacidad y estado de la actividad
  SELECT capacity, status INTO v_capacity, v_status FROM public.activities WHERE id = NEW.activity_id;
  
  IF v_status != 'published' THEN
    RAISE EXCEPTION 'No es posible inscribirse a una actividad no publicada.';
  END IF;

  -- Contar inscripciones actuales
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

-- 7. Trigger para creación automática del perfil en `participants` tras Sign Up en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.participants (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔒 4. Políticas de Seguridad (Row Level Security - RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ── Politicas de `participants` ──
CREATE POLICY "Perfil visible para usuarios autenticados" 
  ON public.participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.participants FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── Politicas de `activities` ──
-- Lectura: Administradores ven todo; Participantes solo publicadas.
CREATE POLICY "Lectura de actividades segun rol" 
  ON public.activities FOR SELECT TO authenticated USING (
    status = 'published' OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

-- Modificacion / Borrado: Solo Admins
CREATE POLICY "Admins gestionan actividades" 
  ON public.activities FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Politicas de `registrations` ──
-- Lectura: El propio participante o Administradores
CREATE POLICY "Lectura de inscripciones" 
  ON public.registrations FOR SELECT TO authenticated USING (
    participant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );

-- Creacion: Unicamente para si mismo
CREATE POLICY "Crear inscripcion propia" 
  ON public.registrations FOR INSERT TO authenticated WITH CHECK (
    participant_id = auth.uid()
  );

-- Borrado (Cancelacion BR-005, BR-008): El propio participante o un Admin
CREATE POLICY "Cancelar inscripcion propia o admin" 
  ON public.registrations FOR DELETE TO authenticated USING (
    participant_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.participants WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 📁 5. Estructura de Carpetas del Proyecto

```
eventia/
├── specs/
│   ├── product-brief.md
│   ├── business-rules.md
│   └── technical-spec.md
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── activities/
│   │       ├── ActivityCard.jsx
│   │       ├── ActivityFormModal.jsx
│   │       └── AttendeeListModal.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useActivities.js
│   │   └── useRegistrations.js
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   └── dataAccess/               <-- Capa de Desacoplamiento de Datos
│   │       ├── index.js
│   │       ├── activitiesRepository.js
│   │       ├── registrationsRepository.js
│   │       └── participantsRepository.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Catalog.jsx
│   │   ├── MyRegistrations.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 🔌 6. Módulo Desacoplado de Acceso a Datos (`src/lib/dataAccess`)

Para garantizar que Supabase pueda ser sustituido por otro backend con cambios mínimos, los componentes UI consumirán únicamente la API expuesta en `src/lib/dataAccess/index.js`:

```javascript
// src/lib/dataAccess/activitiesRepository.js
import { supabase } from '../supabaseClient';

export const activitiesRepository = {
  async getAllPublished() {
    const { data, error } = await supabase
      .from('activities')
      .select('*, registrations(count)')
      .eq('status', 'published')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data.map(item => ({
      ...item,
      registered_count: item.registrations[0]?.count || 0,
      available_spots: item.capacity - (item.registrations[0]?.count || 0)
    }));
  },

  async create(activityData) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
```

---

## ✅ 7. Mapeo de Validaciones por Capa

| Regla de Negocio | Validación UI (Frontend) | Validación Base de Datos (PostgreSQL/Supabase) |
| :--- | :--- | :--- |
| **BR-001 / BR-007** (Cupo Máximo) | Deshabilitar botón "Inscribirme" si `available_spots === 0` | Trigger `check_capacity_before_registration` cancela transacción si `current >= capacity` |
| **BR-003** (Inscripción Única) | Ocultar opción de reinscripción si el usuario ya está anotado | Constraint `UNIQUE(activity_id, participant_id)` en `registrations` |
| **BR-006** (Admin Cupo Min.) | Formulario valida `capacity >= current_registrations` | RLS y Constraint CHECK `capacity > 0` |
| **BR-008** (Cancelación Propia) | UI solo muestra botón "Cancelar" en mis inscripciones | RLS DELETE policy `participant_id = auth.uid()` |
| **BR-012** (Fecha Futura) | Input date HTML5 valida `min = hoy` | Frontend validation antes de `insert` |
