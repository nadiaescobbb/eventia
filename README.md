# 💻 Eventia — Plataforma de Gestión de Eventos & Control de Concurrencia

> **Autoría & Desarrollo**: Nadia Escobar — *Frontend Engineer & Software Architecture*  
> **Evento**: HackLab + Hackathon Corrientes 2026 | **Metodología**: Agent-Driven Development (ADD)  
> **Stack**: React 18 · TypeScript 5.7 · Supabase (PostgreSQL / Auth / RLS) · Tailwind CSS · Vite

---

## 👤 Acerca de la Autora & Propósito Técnico

Este repositorio fue diseñado e implementado por **Nadia Escobar** con el propósito de demostrar patrones de **Arquitectura Frontend Senior**, diseño desacoplado de datos y resolución de concurrencia en tiempo real.

En lugar de construir una SPA convencional acoplada directamente al SDK del backend, este proyecto destaca por:

1. **Patrón Repositorio / Capa de Abstracción (`src/lib/dataAccess`)**: Desacoplamiento total entre los componentes UI de React y Supabase. Si la infraestructura subyacente de datos cambia, las vistas no requieren modificaciones.
2. **Consistencia Transaccional & Concurrencia (PL/pgSQL)**: La regla de no superar cupos máximos se garantiza a nivel de base de datos en PostgreSQL mediante triggers y funciones atómicas, previniendo *race conditions* ante solicitudes simultáneas.
3. **Seguridad Basada en Roles (Row Level Security - RLS)**: Control de acceso granular directo en motor SQL que valida y restringe permisos de lectura y escritura según el rol (`admin` vs `participant`).
4. **Metodología Guiada por Agentes (ADD)**: Implementación disciplinada estructurada en etapas: Especificación de Negocio $\rightarrow$ Reglas de Negocio Estrictas ($\text{BR-001}$ al $\text{BR-019}$) $\rightarrow$ Arquitectura Técnica $\rightarrow$ Código Tipado y Mantenible.

---

## 🛠️ Decisiones de Ingeniería & Patrones de Diseño

### 1. Desacoplamiento Estricto de la Capa de Datos
Para evitar la fuga de abstracción (*leaky abstractions*):
* Todas las operaciones de lectura y mutación están encapsuladas en `activitiesService` y `registrationsService`.
* Los errores del backend (violación de constraints, triggers o bloqueos RLS) son interceptados por un **Mapeador Semántico de Errores** (`src/lib/dataAccess/errors.ts`), traduciéndolos a tipos dominiales claros (`CUPOS_AGOTADOS`, `YA_INSCRIPTO`, `PERMISO_DENEGADO`).

### 2. Garantía de Integridad (BR-001, BR-003, BR-014)
* **Unicidad de Inscripción**: Restricción `UNIQUE(activity_id, participant_id)` en la tabla `registrations`.
* **Control Transaccional de Capacidad**: Trigger SQL `check_capacity_before_registration` que invalida la transacción en PostgreSQL si la disponibilidad es cero.
* **Protección de Cupos en Modificación (BR-006)**: Validación pre-mutación en `activitiesService.updateActivity()` que impide a un administrador definir un cupo inferior a las inscripciones ya confirmadas.

---

## 📐 Reglas de Negocio Implementadas

| Regla | Dominio | Mecanismo de Control Técnico |
| :--- | :--- | :--- |
| **BR-001** | Control de Cupo Máximo | Trigger PL/pgSQL `check_capacity_before_registration` en PostgreSQL |
| **BR-002** | Liberación Inmediata | Operación DELETE atómica en `registrations` |
| **BR-003** | Inscripción Única | Constraint `UNIQUE(activity_id, participant_id)` |
| **BR-005** | Autonomía de Cancelación | RLS Policy `DELETE TO authenticated USING (participant_id = auth.uid())` |
| **BR-006** | Protección de Cupos Admin | Validación en `activitiesService.updateActivity()` previa a la mutación |
| **BR-014** | Manejo de Concurrencia | Transacciones atómicas a nivel de motor PostgreSQL |
| **BR-017** | Cálculo Dinámico de Cupos | Vista de Ocupación `v_activity_occupancy` + DTO transformado |

---

## 📁 Estructura del Proyecto

```
src/
├── types/
│   └── events.ts                # Contratos e Interfaces TypeScript de Dominio
├── context/
│   └── AuthContext.tsx        # Gestión de Sesión Global y Roles (Admin / Participant)
├── lib/
│   ├── supabaseClient.ts        # Cliente Oficial Supabase (Singleton)
│   └── dataAccess/              # Capa de Abstracción y Repositorio de Datos
│       ├── errors.ts            # Estandarización y Mapeo de Errores
│       ├── activitiesService.ts # Lógica de Negocio de Eventos
│       └── registrationsService.ts # Lógica de Inscripciones
├── components/
│   ├── auth/                    # Guardas de Rutas (ProtectedRoute, AdminRoute)
│   ├── layout/                  # UI Layout & Navbar Contextual por Rol
│   ├── common/                  # Sistema de Notificaciones Toast
│   └── activities/              # Componentes UI (Cards, Modales de Edición y Asistentes)
└── pages/
    ├── auth/                    # Vistas de Autenticación (Login, Register)
    ├── ActivitiesCatalog.tsx    # Catálogo Principal con Buscador y Filtros
    ├── MyRegistrations.tsx      # Gestión de Inscripciones del Participante
    └── AdminDashboard.tsx       # Consola de Métricas y Administración
```

---

## ⚙️ Instalación & Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/nadiaescobbb/eventia.git
cd eventia

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# 4. Inicializar Base de Datos en Supabase
# Ejecutar el script SQL de supabase/migrations/20260821_init.sql en el SQL Editor de Supabase.

# 5. Iniciar servidor de desarrollo
npm run dev

# 6. Compilación de producción
npm run build
```

---

## 📜 Licencia

Proyecto distribuido bajo la Licencia MIT.  
**Desarrollado y mantenido por Nadia Escobar** — 2026.
