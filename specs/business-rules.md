# Reglas de Negocio: Plataforma de Gestión de Actividades y Eventos (Eventia)

El presente documento define formalmente las reglas de negocio, restricciones, validaciones, casos borde y reglas implícitas requeridas para la plataforma de gestión de eventos. 

Este documento fue generado exclusivamente a partir del [product-brief.md](file:///C:/Users/devco/.gemini/antigravity/scratch/eventia/specs/product-brief.md) y sirve de insumo primario para las especificaciones técnicas.

---

## 🟢 Reglas Explícitas

* **BR-001 (Control de Cupo Máximo)**: La cantidad total de participantes inscriptos confirmados en una actividad no podrá superar bajo ninguna circunstancia el cupo máximo definido para dicha actividad.
* **BR-002 (Liberación Inmediata de Cupo)**: Cuando un participante confirma la cancelación de su inscripción vigente, la plaza ocupada quedará disponible de inmediato para ser reservada por otro usuario.
* **BR-003 (Inscripción Única por Actividad)**: Un participante solo puede poseer una única inscripción activa por actividad. No se permite duplicar inscripciones para la misma persona en el mismo evento.
* **BR-004 (Reducción Automática del Cupo Disponible)**: Cada inscripción exitosa confirmada disminuye de forma inmediata en una unidad (1) el cupo disponible mostrado para la actividad.
* **BR-005 (Autonomía de Cancelación del Participante)**: Los participantes pueden cancelar su propia inscripción en cualquier momento previo a la fecha y hora de inicio de la actividad.

---

## ⛔ Restricciones

* **BR-006 (Restricción de Modificación de Cupos por el Admin)**: El administrador no puede modificar el cupo máximo de una actividad a una cifra inferior al número actual de participantes ya inscriptos en ella.
* **BR-007 (Restricción de Inscripción en Actividades Sin Cupo)**: El sistema debe bloquear e impedir cualquier intento de inscripción a actividades cuyo cupo disponible sea igual a cero (0).
* **BR-008 (Restricción de Cancelación Ajena)**: Un participante únicamente puede cancelar sus propias inscripciones. Ningún participante tiene permisos para cancelar la inscripción de otro usuario.
* **BR-009 (Restricción de Eventos Pasados)**: No se permiten nuevas inscripciones ni cancelaciones en actividades cuya fecha y hora de inicio ya hayan transcurrido.

---

## 🔍 Validaciones

* **BR-010 (Campos Obligatorios en Creación de Actividad)**: Para poder guardar o publicar una nueva actividad, el administrador debe completar de forma obligatoria: Nombre, Descripción, Fecha y Hora de Inicio, Lugar/Modalidad y Cupo Máximo.
* **BR-011 (Validación de Cupo Positivo)**: El cupo máximo asignado a una actividad debe ser siempre un número entero estrictamente mayor a cero (`Cupo > 0`).
* **BR-012 (Validación de Fecha Futura)**: La fecha y hora programadas para una nueva actividad deben ser posteriores a la fecha y hora actual en el momento de la creación (`Fecha_Evento > Fecha_Actual`).
* **BR-013 (Validación de Autenticación de Usuario)**: Para realizar una inscripción o cancelación, el usuario debe estar autenticado e identificado activamente en la plataforma.

---

## ⚠️ Casos Borde

* **BR-014 (Inscripción Concurrente al Último Cupo)**: Si dos o más participantes intentan inscribirse simultáneamente cuando queda un solo (1) cupo disponible, únicamente la primera solicitud procesada exitosamente obtendrá la reserva. Las solicitudes concurrentes posteriores deberán ser rechazadas notificando la falta de disponibilidad.
* **BR-015 (Eliminación/Cancelación de Actividad por Admin)**: Si un administrador deshace o cancela una actividad que ya posee participantes inscriptos, todas las inscripciones asociadas quedarán anuladas automáticamente y el estado de la actividad pasará a "Cancelada".
* **BR-016 (Reintento de Inscripción Tras Cancelación)**: Si un participante cancela voluntariamente su inscripción a una actividad, podrá volver a inscribirse a la misma actividad en el futuro, siempre y cuando aún existan cupos disponibles al momento del reintento.

---

## ⚙️ Reglas Implícitas Necesarias

* **BR-017 (Cálculo Dinámico de Cupos Disponibles)**: El cupo disponible de una actividad es un valor derivado en tiempo real que se calcula como:  
  $$\text{Cupo Disponible} = \text{Cupo Máximo} - \text{Inscripciones Confirmadas Vigentes}$$
* **BR-018 (Estado Inicial de una Actividad)**: Toda actividad recién creada por el administrador inicia por defecto en estado "Borrador" o "Publicada" con 0 participantes inscriptos.
* **BR-019 (Visibilidad Diferenciada por Rol)**: Los participantes solo pueden visualizar actividades en estado "Publicada" cuya fecha de inicio sea futura. Los administradores pueden visualizar todas las actividades (publicadas, borradores y canceladas).
