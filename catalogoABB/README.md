# catalogoABB

Catálogo técnico ABB (Supabase / PostgreSQL) — piloto con un manual Excel.

## Qué incluye

- Esquema relacional según tu DBML (`supabase/migrations/`)
- Vista `v_configuracion_lineas` y función `buscar_variador(texto, voltaje)`
- ETL Python para **un Excel de ejemplo**: `EN_ACS880-04_560_to_2200_kW_HW_L_A4.xlsx`

## 1. Proyecto Supabase `catalogoABB`

Si ya creaste el proyecto en [supabase.com](https://supabase.com):

1. **SQL Editor** → New query → ejecuta **en orden** (copiar/pegar cada archivo):
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_views_search.sql`

2. **Project Settings → Database** → copia el **Connection string (URI)**.

## 2. Configurar y cargar datos

```powershell
cd C:\Users\aleja\Projects\catalogoABB
copy .env.example .env
# Edita .env y pega DATABASE_URL

pip install -r requirements.txt
python etl/load_pilot_excel.py
```

## 3. Probar búsqueda

En **SQL Editor** de Supabase:

```sql
SELECT * FROM buscar_variador('1140A-3', '400');
```

O desde la API (PostgREST):

```
POST /rest/v1/rpc/buscar_variador
{ "p_busqueda": "1140A-3", "p_voltaje": "400" }
```

## Estructura cargada (piloto)

| Hoja Excel | Tablas |
|------------|--------|
| Rangos_operacion | variadores, frames, variador_frames |
| breakers / Fusibles | componentes, variador_componentes |
| Filtros_modo_comun | filtros, variador_filtros |
| accesoriosMecanicos | frame_accesorios |
| tamañosFrames | frame_specs |
| BCU / UCU | control_modules, terminales_control |

## Siguiente paso

Repetir ETL con el resto de archivos en `OneDrive\Documentos\HW`, cambiando `VERSION_CATALOGO` y mapeos por familia.
