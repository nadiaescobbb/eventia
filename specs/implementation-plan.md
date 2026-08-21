# Plan de Implementación: Plataforma Eventia

Este documento establece el plan de ejecución paso a paso para la construcción de la plataforma **Eventia**. El plan está estructurado en etapas incrementales e independientes para permitir validaciones continuas durante el desarrollo.

Fue elaborado a partir de los documentos [product-brief.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/product-brief.md), [business-rules.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/business-rules.md) y [technical-spec.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/technical-spec.md).

---

## 🎯 Principios del Plan
1. **Desarrollo Incremental**: Cada etapa produce un entregable funcional y testeable independientemente.
2. **Criterios de Aceptación Claros**: Definición explícita de éxito para cada tarea antes de pasar a la siguiente.
3. **Desacoplamiento Estricto**: Mantenimiento del patrón de repositorio en `src/lib/dataAccess/` para independizar la UI de Supabase.

---

## 📌 Etapa 1: Inicialización del Proyecto Frontend (Vite + React + Tailwind CSS)
* **Objetivo**: Estructurar el proyecto base, instalar dependencias y configurar Tailwind CSS.
* **Tareas**:
  - Inicializar proyecto Vite con React.
  - Instalar `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`.
  - Configurar `tailwind.config.js` y `vite.config.js`.
  - Crear estructura base de carpetas (`src/components`, `src/pages`, `src/lib/dataAccess`, `src/context`).
* **Criterio de Aceptación**: `npm run dev` compila sin errores y levanta la aplicación local en `localhost:5173`.

---

## 📌 Etapa 2: Configuración del Cliente Supabase y Capa de Datos Desacoplada
* **Objetivo**: Conectar con Supabase (Project ID `izwlzlbjjxpqrctvcyfu`) e implementar el módulo `dataAccess`.
* **Tareas**:
  - Configurar `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  - Implementar `src/lib/supabaseClient.js`.
  - Crear los repositorios en `src/lib/dataAccess/`:
    - `activitiesRepository.js` (métodos: `getAll`, `create`, `updateStatus`, `delete`).
    - `registrationsRepository.js` (métodos: `register`, `cancel`, `getByParticipant`).
    - `participantsRepository.js` (métodos: `getProfile`, `updateProfile`).
* **Criterio de Aceptación**: Métodos de repositorio prueban lectura/escritura limpia contra las tablas de Supabase.

---

## 📌 Etapa 3: Autenticación y Gestión de Contexto de Usuario (`AuthContext`)
* **Objetivo**: Implementar Sign Up, Login, Logout y almacenamiento global del perfil de usuario y su rol.
* **Tareas**:
  - Crear `AuthContext.jsx` y `useAuth()` hook.
  - Implementar páginas `Login.jsx` y `Register.jsx` (incluyendo selector/checkbox de rol para Admin o Participante).
  - Manejo de sesión persistente con `supabase.auth.onAuthStateChange`.
* **Criterio de Aceptación**: Un usuario puede registrarse, iniciar sesión, ver su rol reflejado en el contexto y cerrar sesión correctamente.

---

## 📌 Etapa 4: Componentes Reutilizables de Interfaz (UI Toolkit)
* **Objetivo**: Desarrollar la librería visual básica con Tailwind CSS.
* **Tareas**:
  - Navbar con información de usuario, insignia de rol (`admin`/`participant`) y botón Logout.
  - `ActivityCard.jsx` con indicador visual de cupos disponibles (`disponibles / total`).
  - Modales reutilizables (`Modal.jsx`, `ActivityFormModal.jsx`, `AttendeeListModal.jsx`).
  - Insignias de estado (`Borrador`, `Publicada`, `Sin Cupos`, `Inscripto`).
* **Criterio de Aceptación**: Componentes renderizan correctamente en modo responsivo sin errores de consola.

---

## 📌 Etapa 5: Catálogo de Actividades e Inscripción (Vista Participante)
* **Objetivo**: Permitir a los participantes explorar eventos, inscribirse y cancelar inscripciones.
* **Tareas**:
  - Implementar `Catalog.jsx` (lista de actividades en estado `published`).
  - Implementar botón de acción dinámica ("Inscribirme", "Inscripto / Cancelar", "Agotado").
  - Implementar `MyRegistrations.jsx` (sección personal para ver y cancelar inscripciones vigentes).
  - Integrar validación de cupos y refresco en tiempo real del cálculo dinámico (`BR-001`, `BR-002`, `BR-003`).
* **Criterio de Aceptación**: Al presionar "Inscribirme", el cupo disponible disminuye en 1 y se deshabilita la doble inscripción. Al cancelar, el cupo vuelve a estar disponible inmediatamente.

---

## 📌 Etapa 6: Panel de Administración de Eventos (Vista Admin)
* **Objetivo**: Permitir a los organizadores crear eventos, publicar/cancelar y ver la lista de asistentes.
* **Tareas**:
  - Implementar `AdminDashboard.jsx` (CRUD de actividades).
  - Formulario modal para crear nueva actividad (validando campos obligatorios, fecha futura y cupo > 0).
  - Modal de lista de asistentes para consultar nombre y correo de los participantes inscriptos en cada evento.
* **Criterio de Aceptación**: El Administrador puede crear una actividad, cambiar su estado a "Publicada" y visualizar la nómina completa de asistentes inscriptos.

---

## 📌 Etapa 7: Pruebas de Integración y Casos Borde
* **Objetivo**: Verificar el cumplimiento estricto de todas las reglas de negocio (`BR-001` a `BR-019`).
* **Pruebas**:
  - Concurrencia en último cupo (verificar rechazo por trigger SQL `check_capacity_before_registration`).
  - Intento de inscripción en eventos sin cupo o en estado borrador.
  - Verificación de seguridad RLS (participantes no deben poder editar o borrar eventos).
* **Criterio de Aceptación**: 100% de los flujos principales y casos borde probados exitosamente sin fallos ni errores no controlados.

---

## 📌 Etapa 8: Despliegue en la Nube (Vercel)
* **Objetivo**: Publicar el MVP entregable en entorno productivo mediante Vercel.
* **Tareas**:
  - Generar build de producción (`npm run build`).
  - Configurar variables de entorno en Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - Realizar el despliegue y verificar la URL productiva final.
* **Criterio de Aceptación**: La aplicación está desplegada en Vercel, conectada a Supabase y totalmente funcional desde la nube.
