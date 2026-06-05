-- Vistas mínimas recomendadas para el frontend ABB Drive Catalog.
-- Ejecutar en Supabase SQL Editor.
-- Estas vistas no crean datos nuevos; solo simplifican las consultas desde Supabase JS.

CREATE OR REPLACE VIEW public.v_variadores_resumen AS
SELECT
  v.id_variador,
  v.modelo,
  v.referencia_interna,
  v.id_familia,
  fam.codigo AS familia_codigo,
  fam.descripcion AS familia_descripcion,
  v.id_tipo_variador,
  tv.codigo AS tipo_variador_codigo,
  tv.descripcion AS tipo_variador_descripcion,
  v.voltaje_nominal,
  v.corriente_nominal,
  v.corriente_max,
  v.corriente_normal_duty_a,
  v.corriente_light_duty_a,
  v.corriente_heavy_duty_a,
  COALESCE(v.corriente_normal_duty_a, v.corriente_nominal) AS corriente_busqueda_normal_a,
  COALESCE(v.corriente_heavy_duty_a, v.corriente_max) AS corriente_busqueda_heavy_a,
  v.potencia_nominal_kw,
  v.potencia_heavy_duty_kw,
  v.potencia_normal_duty_kw,
  v.potencia_light_duty_kw,
  COALESCE(v.potencia_normal_duty_kw, v.potencia_nominal_kw) AS potencia_busqueda_kw,
  v.potencia_nominal_kva,
  v.potencia_nominal_hp,
  v.p_loss_kw,
  v.airflow_m3h,
  v.noise_db,
  v.descripcion,
  v.version_catalogo,
  v.manual_origen,
  v.estado,
  v.created_at,
  (
    SELECT string_agg(vf.cantidad::text || 'x' || fr.codigo_frame, ' + ' ORDER BY vf.posicion)
    FROM public.variador_frames vf
    JOIN public.frames fr ON fr.id_frame = vf.id_frame
    WHERE vf.id_variador = v.id_variador
  ) AS frame_configuracion
FROM public.variadores v
LEFT JOIN public.familias fam ON fam.id_familia = v.id_familia
LEFT JOIN public.tipos_variador tv ON tv.id_tipo_variador = v.id_tipo_variador;

CREATE OR REPLACE VIEW public.v_variador_frames_detalle AS
SELECT
  vf.id_variador_frame,
  vf.id_variador,
  vf.id_frame,
  fr.codigo_frame,
  fr.categoria,
  vf.cantidad,
  vf.posicion,
  vf.observaciones,
  fs.alto_mm,
  fs.ancho_mm,
  fs.profundidad_mm,
  fs.peso_kg,
  fs.grado_proteccion,
  COALESCE(fr.safety_distance_mm, fs.safety_distance_mm) AS safety_distance_mm,
  COALESCE(fr.safety_distance_note, fs.safety_distance_note) AS safety_distance_note,
  fs.airflow_m3h,
  fs.noise_db,
  fs.perdidas_w,
  fs.version_catalogo
FROM public.variador_frames vf
JOIN public.frames fr ON fr.id_frame = vf.id_frame
LEFT JOIN LATERAL (
  SELECT fs1.*
  FROM public.frame_specs fs1
  WHERE fs1.id_frame = fr.id_frame
  ORDER BY fs1.version_catalogo NULLS LAST
  LIMIT 1
) fs ON true;

CREATE OR REPLACE VIEW public.v_variador_componentes_detalle AS
SELECT
  vc.id_relacion,
  vc.id_variador,
  vc.id_componente,
  c.ordering_code,
  c.nombre_componente,
  c.fabricante,
  c.descripcion,
  tc.codigo AS tipo_componente,
  tc.descripcion AS tipo_componente_descripcion,
  vc.cantidad,
  vc.ubicacion_funcional,
  vc.observaciones
FROM public.variador_componentes vc
JOIN public.componentes c ON c.id_componente = vc.id_componente
LEFT JOIN public.tipos_componentes tc ON tc.id_tipo_componente = c.id_tipo_componente;

CREATE OR REPLACE VIEW public.v_variador_filtros_detalle AS
SELECT
  vf.id_relacion,
  vf.id_variador,
  vf.id_filtro,
  f.tipo_filtro,
  f.descripcion_tecnica,
  c.id_componente,
  c.ordering_code,
  c.nombre_componente,
  c.fabricante,
  vf.cantidad,
  vf.ubicacion,
  vf.tipo_instalacion,
  vf.observaciones
FROM public.variador_filtros vf
JOIN public.filtros f ON f.id_filtro = vf.id_filtro
JOIN public.componentes c ON c.id_componente = f.id_componente;

-- Si tienes RLS activado, el frontend con anon key necesita permiso SELECT.
-- Ajusta estas políticas según tu seguridad real.
-- Ejemplo básico solo lectura:
-- ALTER TABLE public.variadores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_select_variadores" ON public.variadores FOR SELECT TO anon USING (true);
