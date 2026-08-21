# 🗓️ Eventia - Plataforma de Gestión de Actividades y Eventos

[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Eventia** es una aplicación web moderna diseñada para la **gestión centralizada de eventos y actividades con cupos limitados**. Permite a organizadores (*Administradores*) publicar y gestionar eventos, y a asistentes (*Participantes*) explorar, inscribirse y cancelar reservaciones en tiempo real con control estricto de concurrencia y sobrecupos.

Desarrollada en el marco de **HackLab + Hackathon Corrientes 2026** aplicando la metodología de **Desarrollo Guiado con Agentes (Agent-Driven Development)**.

---

## 🌟 Características Principales

### 👥 Perfil Participante
* **Catálogo de Eventos**: Exploración de actividades publicadas con buscador en tiempo real y filtros por estado (`Disponibles`, `Agotadas`).
* **Indicador de Ocupación**: Barra visual de cupos disponibles vs. totales calculados dinámicamente.
* **Inscripción en 1 Clic**: Reserva de plaza instantánea con verificación de sobrecupo.
* **Mis Inscripciones**: Panel personal para consultar y cancelar reservaciones vigentes con liberación inmediata de cupo para otros usuarios.

### 🛡️ Perfil Administrador
* **Dashboard Kpi Header**: Métricas globales en tiempo real (eventos activos, total de inscriptos y porcentaje de ocupación global).
* **Gestión de Actividades (CRUD)**: Creación y edición de eventos en estados `Borrador`, `Publicado` o `Cancelado`.
* **Protección de Cupos**: Validación estricta que impide reducir la capacidad de un evento por debajo de los inscriptos confirmados actuales.
* **Nómina de Asistentes**: Modal interactivo para inspeccionar la lista de inscriptos (nombre, email y fecha de registro) por actividad.

---

## 🏗️ Arquitectura y Stack Tecnológico

```
[ Frontend: React 18 + Vite + Tailwind CSS ]
                     │
                     ▼ (Llamadas desacopladas via Repositorio/Abstracción)
            [ Módulo DataAccess ]  <-- (src/lib/dataAccess)
                     │
                     ▼ (@supabase/supabase-js)
       [ Supabase PostgreSQL + Auth Engine ]
```

* **Frontend**: SPA construida en React 18, TypeScript 5.7, Vite 6 y Tailwind CSS.
* **Base de Datos & Auth**: Supabase (PostgreSQL) con **Row Level Security (RLS)** y **Triggers PL/pgSQL** para control de sobrecupos a nivel de servidor.
* **Desacoplamiento Estricto de Datos**: La capa `src/lib/dataAccess/` aísla las consultas de la interfaz, asegurando que la UI no dependa directamente del SDK del backend.

---

## 📐 Reglas de Negocio Implementadas (`BR-001` a `BR-019`)

| Código | Regla de Negocio | Descripción |
| :--- | :--- | :--- |
| **BR-001** | Control de Cupo Máximo | La cantidad de inscriptos nunca puede superar el cupo máximo definido. |
| **BR-002** | Liberación Inmediata | Al cancelar una inscripción, la plaza queda disponible al instante. |
| **BR-003** | Inscripción Única | Un participante no puede duplicar su inscripción a una misma actividad. |
| **BR-005** | Autonomía de Cancelación | Los participantes pueden cancelar sus inscripciones vigentes antes del evento. |
| **BR-006** | Protección de Cupos Admin | El admin no puede definir un cupo inferior a los inscriptos ya confirmados. |
| **BR-014** | Concurrencia en Último Cupo | Manejo de solicitudes simultáneas resuelto por transacciones/triggers en PostgreSQL. |
| **BR-017** | Cálculo Dinámico | $\text{Cupos Disponibles} = \text{Cupo Máximo} - \text{Inscritos Confirmados}$. |

---

## 📂 Estructura del Proyecto

```
eventia/
├── specs/                           # Especificaciones del desarrollo guiado
│   ├── product-brief.md
│   ├── business-rules.md
│   ├── technical-spec.md
│   └── implementation-plan.md
├── supabase/
│   └── migrations/
│       └── 20260821_init.sql         # Migración SQL (Tablas, RLS, Triggers y Vistas)
├── src/
│   ├── types/
│   │   └── events.ts                # Interfaces TypeScript estrictas
│   ├── context/
│   │   └── AuthContext.tsx          # Gestión de sesión Supabase y Roles
│   ├── lib/
│   │   ├── supabaseClient.ts        # Cliente de conexión oficial
│   │   └── dataAccess/              # Módulo de datos desacoplado
│   │       ├── errors.ts            # Mapeo semántico de errores
│   │       ├── activitiesService.ts # Servicio de eventos y métricas
│   │       └── registrationsService.ts # Servicio de inscripciones
│   ├── components/
│   │   ├── auth/                    # Guardas de rutas (ProtectedRoute, AdminRoute)
│   │   ├── layout/                  # Navbar con insignias de rol
│   │   ├── common/                  # Sistema de Toast Feedback
│   │   └── activities/              # Tarjetas, modales y formularios
│   ├── pages/
│   │   ├── auth/                    # Vistas Login y Register
│   │   ├── ActivitiesCatalog.tsx    # Catálogo principal con filtros
│   │   ├── MyRegistrations.tsx      # Gestión de inscripciones del usuario
│   │   └── AdminDashboard.tsx       # Consola de administración
│   ├── App.tsx                      # Router principal
│   └── main.tsx
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## ⚡ Guía de Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/nadiaescobbb/eventia.git
cd eventia
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Inicializar la Base de Datos en Supabase
Ejecuta el script SQL ubicado en `supabase/migrations/20260821_init.sql` desde el **SQL Editor** de tu panel de Supabase para crear las tablas (`participants`, `activities`, `registrations`), triggers y políticas RLS.

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Accede a [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🧪 Verificación y Build

Para compilar el proyecto y verificar que no existan errores de TypeScript:

```bash
npm run build
```

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Desarrollado con ❤️ para el **HackLab + Hackathon Corrientes 2026**.
