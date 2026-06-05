# Conectar el ETL a Supabase online

No necesitas instalar Supabase. Solo la **URI de PostgreSQL** en `.env`.

## 1. Obtener la contraseña de base de datos

Si no la recuerdas:

1. [supabase.com](https://supabase.com) → proyecto **catalogoABB**
2. **Project Settings** (engranaje) → **Database**
3. **Reset database password** → guarda la contraseña nueva

## 2. Copiar Connection string

En la misma página **Database**:

1. Pestaña **Connection string**
2. Tipo: **URI**
3. Modo: **Session pooler** (recomendado) o **Direct connection**
4. Copia la cadena. Se ve así:

```text
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

5. Sustituye `[YOUR-PASSWORD]` por tu contraseña real (sin corchetes).

### Error frecuente (tu caso)

Si ves `could not translate host name "algo@db....supabase.co"`:

Usaste **`@`** entre usuario y contraseña. Debe ser **`:`** (dos puntos).

```text
MAL:   postgresql://postgres@base123@db.ylzydydcpdgshfaprpup.supabase.co:5432/postgres
BIEN:  postgresql://postgres:base123@db.ylzydydcpdgshfaprpup.supabase.co:5432/postgres
                              ^
```

### Windows: error `could not translate host name` con `db.xxx.supabase.co`

El host **directo** a veces solo tiene **IPv6**. Muchas redes en Windows no lo enrutan bien.

**Solución:** en Supabase usa **Session pooler** (puerto **6543**):

```env
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.ylzydydcpdgshfaprpup
DB_PASSWORD=tu@contraseña
```

La región (`eu-central-1`, `us-east-1`, …) debe coincidir con la de tu proyecto (sale en la URI del dashboard).

Prueba: `python etl/test_connection.py`

---

**Direct connection** (puerto 5432):

```text
postgresql://postgres:TU_PASSWORD@db.ylzydydcpdgshfaprpup.supabase.co:5432/postgres
```

**Session pooler** (puerto 6543; usuario lleva el project ref):

```text
postgresql://postgres.ylzydydcpdgshfaprpup:TU_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

### Contraseña con `@` (tu caso)

En una URI, el `@` separa credenciales del servidor. Si tu contraseña es por ejemplo `mi@clave123`, **no** la pegues cruda en `DATABASE_URL`.

**Opción A — Variables en `.env` (la más fácil):**

```env
DB_HOST=db.ylzydydcpdgshfaprpup.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mi@clave123
DB_NAME=postgres
DB_SSLMODE=require
```

El script `load_pilot_excel.py` ya soporta esto: la contraseña va **tal cual**, con `@`.

**Opción B — Codificar en `DATABASE_URL`:**

| Carácter | En la URI |
|----------|-----------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |

Ejemplo: contraseña `mi@clave` → `mi%40clave`

```env
DATABASE_URL=postgresql://postgres:mi%40clave@db.ylzydydcpdgshfaprpup.supabase.co:5432/postgres
```

**Opción C — Plantilla Supabase + variable:**

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ylzydydcpdgshfaprpup.supabase.co:5432/postgres
DB_PASSWORD=mi@clave123
```

**Opción D:** Resetear contraseña en Supabase a una sin caracteres raros.

## 3. Pegar en `.env`

Archivo: `C:\Users\aleja\Projects\catalogoABB\.env`

```env
DATABASE_URL=postgresql://postgres.xxxx:TU_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres
APPLY_MIGRATIONS=1
```

## 4. Tablas en Supabase (solo la primera vez)

En **SQL Editor**, ejecuta antes del ETL:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_views_search.sql`

## 5. Ejecutar carga

```powershell
cd C:\Users\aleja\Projects\catalogoABB
pip install -r requirements.txt
python etl/load_pilot_excel.py
```

## Sobre `frame_parser.py`

Es una **librería auxiliar**, no el programa de carga. Si lo ejecutas solo, solo muestra pruebas del parser:

```powershell
python etl/frame_parser.py
```

El programa que sube el Excel a Supabase es **`load_pilot_excel.py`**.
