# ABB Drive Catalog - Minimal Supabase Frontend

Página local mínima con Vite + TypeScript + Supabase JS para consultar un catálogo técnico ABB ACS880.

## Requisitos

- Node.js instalado
- Proyecto Supabase con las tablas ya cargadas
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No usa:

- `DATABASE_URL`
- contraseña PostgreSQL
- `service_role`
- backend propio
- autenticación
- JSON local

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

Editar `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

## Vistas recomendadas

Ejecuta el archivo:

```text
sql/views.sql
```

en el SQL Editor de Supabase.

La app intenta consultar primero estas vistas:

- `v_variadores_resumen`
- `v_variador_frames_detalle`
- `v_variador_componentes_detalle`
- `v_variador_filtros_detalle`

Si no existen, intenta leer directamente tablas básicas, pero las vistas son mejores porque permiten usar `COALESCE` para duty y potencia.

## Modos de consulta

1. Buscar por modelo o referencia.
2. Buscar por corriente:
   - Normal Duty: usa `corriente_busqueda_normal_a` en la vista, con fallback `corriente_nominal`.
   - Heavy Duty: usa `corriente_busqueda_heavy_a` en la vista, con fallback `corriente_max`.
   - Light Duty: usa `corriente_light_duty_a`.
3. Buscar por potencia:
   - kW: usa `potencia_busqueda_kw` en la vista, con fallback `potencia_nominal_kw`.
   - HP: usa `potencia_nominal_hp`.
   - kVA: usa `potencia_nominal_kva`.

## Permisos Supabase

La anon key solo podrá leer si las tablas/vistas tienen permisos SELECT adecuados.
Si tienes RLS activo, crea políticas de lectura para `anon` según corresponda.
