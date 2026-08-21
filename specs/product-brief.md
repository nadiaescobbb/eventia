# Product Brief: Plataforma de Gestión de Actividades y Eventos (Eventia)

## 🎯 Visión del Producto
Construir una plataforma web intuitiva, confiable y eficiente que permita a las organizaciones gestionar actividades y eventos con cupos limitados de manera centralizada. La solución facilita el proceso de publicación por parte de los organizadores y la inscripción o cancelación por parte de los participantes, garantizando visibilidad y control transparente de la disponibilidad en tiempo real.

---

## 🚀 Objetivos del Producto
1. **Centralizar la administración**: Proveer una consola sencilla para que los administradores creen, publiquen y monitoreen actividades.
2. **Optimizar el proceso de inscripción**: Permitir que los usuarios descubran actividades, se inscriban en pocos pasos y puedan cancelar su participación si lo requieren.
3. **Garantizar el control estricto de cupos**: Asegurar que nunca se supere la capacidad máxima definida para una actividad y que la cancelación libere cupos de forma inmediata para otros usuarios.

---

## 👥 Usuarios Objetivo

### 1. Administrador (Organizador)
* **Perfil**: Persona encargada de planificar, estructurar y supervisar los eventos.
* **Necesidades**:
  * Crear y editar eventos definiendo fecha, hora, ubicación y límite de cupos.
  * Publicar u ocultar eventos según su estado de planificación.
  * Ver el listado actualizado de personas inscriptas por actividad.

### 2. Participante (Usuario Final)
* **Perfil**: Persona interesada en asistir a los eventos expuestos en la plataforma.
* **Necesidades**:
  * Visualizar la oferta de actividades disponibles y su estado de disponibilidad de cupos.
  * Registrarse rápidamente a una actividad de su interés.
  * Consultar sus inscripciones vigentes.
  * Cancelar su registro cuando no pueda asistir a un evento previamente seleccionado.

---

## ✨ Funcionalidades Principales

### Para el Administrador:
* **Gestión de Actividades (CRUD)**: Crear, visualizar, editar y gestionar eventos.
* **Control de Capacidad**: Definir el cupo máximo al momento de crear la actividad.
* **Gestión de Asistentes**: Consultar la nómina de participantes registrados por cada actividad.

### Para el Participante:
* **Catálogo de Actividades**: Explorar actividades disponibles con información clave (nombre, fecha, lugar/modalidad, cupos restantes).
* **Inscripción en Tiempo Real**: Reservar una plaza en una actividad disponible con actualización inmediata de cupos.
* **Mis Inscripciones**: Sección personal para consultar los eventos a los que se encuentra registrado.
* **Cancelación de Inscripción**: Opción para darse de baja de una actividad, actualizando la disponibilidad del evento inmediatamente.

---

## ⚠️ Restricciones Funcionales
1. **Límite Inflexible de Cupos**: Una vez alcanzada la capacidad máxima de una actividad, el sistema debe bloquear automáticamente nuevas inscripciones.
2. **Inscripción Única**: Un mismo participante no puede registrarse más de una vez a la misma actividad.
3. **Cancelación Restringida a la Autoría**: Un participante solo puede cancelar sus propias inscripciones.
4. **Modificación de Cupos por el Admin**: El administrador no puede reducir el cupo máximo por debajo del número de usuarios ya inscriptos en esa actividad.

---

## 📊 Métricas de Éxito
1. **Tasa de Ocupación de Cupos**: Porcentaje de eventos que completan su cupo asignado.
2. **Tasa de Liberación Eficiente**: Porcentaje de cupos cancelados que vuelven a ser ocupados por otros usuarios antes del evento.
3. **Facilidad de Uso (UX)**: Tiempo promedio requerido por un participante para completar una inscripción (< 1 minuto).
