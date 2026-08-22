# Eventia

Plataforma de gestión de eventos con asignación de cupos sin sobreventa, aunque dos personas se registren en el mismo milisegundo.

Desarrollado durante HackLab / Hackathon Corrientes 2026.

## El problema

Cuando una actividad tiene cupo limitado y varios usuarios intentan registrarse al mismo tiempo, validar la disponibilidad desde el cliente no alcanza: dos pedidos pueden leer "queda 1 cupo" en simultáneo y los dos van a intentar tomarlo. La solución no es agregar más validaciones en React — es mover la garantía al único lugar donde una operación puede ser realmente atómica: la transacción de base de datos.

Eventia resuelve esto con un trigger en PL/pgSQL (`check_capacity_before_registration`) que verifica y reserva el cupo dentro de la misma transacción SQL en la que se crea el registro. Postgres, no el cliente, es quien decide si hay lugar.

```sql
-- Ejecuta dentro de la misma transacción del INSERT,
-- así que no hay ventana de tiempo entre "leer cupo" y "reservar cupo"
create trigger check_capacity_before_registration
before insert on registrations
for each row execute function validate_capacity();
```

Sobre esa misma base se apoyan dos decisiones más chicas: un constraint `UNIQUE(activity_id, participant_id)` evita el registro duplicado a nivel de esquema, sin importar qué estado tenga el cliente en ese momento, y las políticas de Row Level Security deciden en el motor —no en el frontend— si un usuario puede mutar un registro que no es suyo.

## Capa de datos

La UI no habla directamente con el SDK de Supabase. Todo pasa por un repository en `src/lib/dataAccess/`, que además traduce los errores crudos de Postgres en estados legibles para la interfaz:

```ts
export function mapDatabaseError(error: PostgrestError): AppError {
  if (error.code === '23505') {
    return { type: 'ALREADY_REGISTERED', message: 'Ya te encuentras inscripto.' };
  }
  if (error.message.includes('capacity_exceeded')) {
    return { type: 'EVENT_FULL', message: 'No quedan cupos disponibles.' };
  }
  return { type: 'UNKNOWN_ERROR', message: 'Ocurrió un error inesperado.' };
}
```

Esto significa que un código de error de Postgres nunca llega crudo a un componente: hay una sola función responsable de decidir qué le dice al usuario.

## Roles

Los participantes tienen lectura global del catálogo y solo pueden cancelar sus propios registros (`auth.uid() = participant_id`). Los administradores tienen control total sobre creación de actividades y acceso al panel de métricas. Ambos límites están escritos como políticas RLS en la base, no como condicionales en el frontend.

## Estructura

```
src/
├── types/          # Contratos e interfaces
├── context/         # AuthContext — sesión y roles
├── lib/
│   ├── supabase.ts   # Cliente singleton
│   └── dataAccess/   # Repository y mapeo de errores
├── components/
│   ├── auth/         # Guards de rutas
│   ├── layout/
│   └── activities/
└── pages/
```

## Puesta en marcha

```bash
git clone https://github.com/nadiaescobbb/eventia.git
cd eventia
npm install
```

Crear `.env` en la raíz:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Ejecutar `supabase/migrations/init.sql` en el SQL Editor de Supabase para crear tablas, triggers y políticas RLS, y luego:

```bash
npm run dev
```

## Licencia

MIT. Nadia Escobar, 2026.
