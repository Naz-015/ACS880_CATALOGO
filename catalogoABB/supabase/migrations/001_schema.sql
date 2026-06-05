-- catalogoABB — Esquema relacional ABB (PostgreSQL / Supabase)
-- Ejecutar en: Supabase Dashboard → SQL → New query

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Lookups
CREATE TABLE familias (
  id_familia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE tipos_variador (
  id_tipo_variador UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE tipos_componentes (
  id_tipo_componente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Variadores
CREATE TABLE variadores (
  id_variador UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo VARCHAR(120) NOT NULL,
  referencia_interna VARCHAR(200) NOT NULL,
  id_familia UUID REFERENCES familias (id_familia),
  id_tipo_variador UUID REFERENCES tipos_variador (id_tipo_variador),
  voltaje_nominal VARCHAR(40),
  corriente_nominal NUMERIC(12, 2),
  corriente_max NUMERIC(12, 2),
  potencia_nominal_kw NUMERIC(12, 2),
  potencia_heavy_duty_kw NUMERIC(12, 2),
  descripcion TEXT,
  version_catalogo VARCHAR(80),
  manual_origen VARCHAR(255),
  estado VARCHAR(30) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_variadores_referencia_version UNIQUE (referencia_interna, version_catalogo)
);

CREATE INDEX idx_variadores_referencia ON variadores (referencia_interna);
CREATE INDEX idx_variadores_voltaje ON variadores (voltaje_nominal);
CREATE INDEX idx_variadores_modelo ON variadores (modelo);

-- Frames
CREATE TABLE frames (
  id_frame UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_frame VARCHAR(80) NOT NULL UNIQUE,
  categoria VARCHAR(40),
  descripcion TEXT
);

CREATE TABLE variador_frames (
  id_variador_frame UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_variador UUID NOT NULL REFERENCES variadores (id_variador) ON DELETE CASCADE,
  id_frame UUID NOT NULL REFERENCES frames (id_frame),
  cantidad INT NOT NULL DEFAULT 1,
  posicion INT NOT NULL DEFAULT 1,
  observaciones TEXT,
  CONSTRAINT uq_variador_frames UNIQUE (id_variador, id_frame, posicion)
);

CREATE TABLE frame_specs (
  id_spec UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_frame UUID NOT NULL REFERENCES frames (id_frame) ON DELETE CASCADE,
  alto_mm NUMERIC(10, 2),
  ancho_mm NUMERIC(10, 2),
  profundidad_mm NUMERIC(10, 2),
  peso_kg NUMERIC(10, 2),
  grado_proteccion VARCHAR(20),
  airflow_m3h NUMERIC(10, 2),
  noise_db NUMERIC(10, 2),
  perdidas_w NUMERIC(12, 2),
  version_catalogo VARCHAR(80),
  CONSTRAINT uq_frame_specs_frame_version UNIQUE (id_frame, version_catalogo)
);

-- Control modules
CREATE TABLE control_modules (
  id_control_module UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_modulo VARCHAR(80) NOT NULL UNIQUE,
  familia VARCHAR(20),
  tipo VARCHAR(40),
  descripcion TEXT
);

CREATE TABLE variador_control_modules (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_variador UUID NOT NULL REFERENCES variadores (id_variador) ON DELETE CASCADE,
  id_control_module UUID NOT NULL REFERENCES control_modules (id_control_module),
  cantidad INT NOT NULL DEFAULT 1,
  funcion VARCHAR(40),
  CONSTRAINT uq_variador_control UNIQUE (id_variador, id_control_module, funcion)
);

CREATE TABLE terminales_control (
  id_terminal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_control_module UUID NOT NULL REFERENCES control_modules (id_control_module) ON DELETE CASCADE,
  terminal_no VARCHAR(20),
  terminal_etiqueta VARCHAR(40),
  descripcion_funcion TEXT,
  signal_type VARCHAR(40),
  voltage_range VARCHAR(80),
  corriente_max VARCHAR(40),
  CONSTRAINT uq_terminal UNIQUE (id_control_module, terminal_no, terminal_etiqueta)
);

-- Componentes
CREATE TABLE componentes (
  id_componente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordering_code VARCHAR(80) NOT NULL,
  nombre_componente VARCHAR(255),
  id_tipo_componente UUID REFERENCES tipos_componentes (id_tipo_componente),
  fabricante VARCHAR(80) DEFAULT 'ABB',
  descripcion TEXT,
  estado VARCHAR(30) DEFAULT 'activo',
  CONSTRAINT uq_componentes_ordering UNIQUE (ordering_code)
);

CREATE TABLE variador_componentes (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_variador UUID NOT NULL REFERENCES variadores (id_variador) ON DELETE CASCADE,
  id_componente UUID NOT NULL REFERENCES componentes (id_componente),
  cantidad INT NOT NULL DEFAULT 1,
  ubicacion_funcional VARCHAR(255) NOT NULL DEFAULT 'GENERAL',
  observaciones TEXT,
  CONSTRAINT uq_variador_componente_ubicacion UNIQUE (id_variador, id_componente, ubicacion_funcional)
);

-- Filtros
CREATE TABLE filtros (
  id_filtro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_componente UUID NOT NULL UNIQUE REFERENCES componentes (id_componente) ON DELETE CASCADE,
  tipo_filtro VARCHAR(40) NOT NULL,
  descripcion_tecnica TEXT
);

CREATE TABLE variador_filtros (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_variador UUID NOT NULL REFERENCES variadores (id_variador) ON DELETE CASCADE,
  id_filtro UUID NOT NULL REFERENCES filtros (id_filtro),
  cantidad INT NOT NULL DEFAULT 1,
  ubicacion TEXT DEFAULT 'GENERAL',
  tipo_instalacion VARCHAR(40),
  observaciones TEXT,
  CONSTRAINT uq_variador_filtro_ubicacion UNIQUE (id_variador, id_filtro, ubicacion)
);

-- Accesorios por frame
CREATE TABLE frame_accesorios (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_frame UUID NOT NULL REFERENCES frames (id_frame) ON DELETE CASCADE,
  id_componente UUID NOT NULL REFERENCES componentes (id_componente),
  cantidad INT NOT NULL DEFAULT 1,
  ubicacion VARCHAR(255) NOT NULL DEFAULT 'GENERAL',
  observaciones TEXT,
  CONSTRAINT uq_frame_accesorio UNIQUE (id_frame, id_componente, ubicacion)
);

-- Compatibilidad
CREATE TABLE frame_filtro_compatibilidad (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_frame UUID NOT NULL REFERENCES frames (id_frame) ON DELETE CASCADE,
  id_filtro UUID NOT NULL REFERENCES filtros (id_filtro),
  compatibilidad VARCHAR(40) NOT NULL,
  observaciones TEXT,
  CONSTRAINT uq_frame_filtro UNIQUE (id_frame, id_filtro)
);

CREATE TABLE frame_control_compatibilidad (
  id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_frame UUID NOT NULL REFERENCES frames (id_frame) ON DELETE CASCADE,
  id_control_module UUID NOT NULL REFERENCES control_modules (id_control_module),
  compatibilidad VARCHAR(40) NOT NULL,
  observaciones TEXT,
  CONSTRAINT uq_frame_control UNIQUE (id_frame, id_control_module)
);

-- BOM kits (opcional)
CREATE TABLE bom_items (
  id_bom UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_component_id UUID NOT NULL REFERENCES componentes (id_componente) ON DELETE CASCADE,
  child_component_id UUID NOT NULL REFERENCES componentes (id_componente),
  cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
  nivel INT DEFAULT 1,
  observaciones TEXT
);

-- ETL
CREATE TABLE etl_imports (
  id_import UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archivo_origen VARCHAR(255) NOT NULL,
  hoja_excel VARCHAR(120),
  fecha_import TIMESTAMPTZ DEFAULT NOW(),
  version_catalogo VARCHAR(80) NOT NULL,
  estado VARCHAR(30) DEFAULT 'completado',
  registros_importados INT DEFAULT 0,
  observaciones TEXT
);

CREATE TABLE stg_variadores_raw (
  id_raw UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_import UUID REFERENCES etl_imports (id_import) ON DELETE SET NULL,
  row_number INT,
  modelo_raw VARCHAR(200),
  frame_raw VARCHAR(200),
  control_raw TEXT,
  filtros_raw TEXT,
  componentes_raw TEXT,
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
