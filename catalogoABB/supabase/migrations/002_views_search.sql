-- Vista unificada para catálogo / Power BI / API
CREATE OR REPLACE VIEW v_configuracion_lineas AS
SELECT
  v.id_variador,
  v.referencia_interna,
  v.modelo,
  v.voltaje_nominal,
  v.potencia_nominal_kw,
  v.corriente_nominal,
  'FRAME' AS seccion,
  f.codigo_frame AS codigo,
  f.categoria AS subtipo,
  vf.cantidad,
  NULL::VARCHAR AS ordering_code,
  vf.posicion::TEXT AS ubicacion,
  vf.observaciones AS detalle
FROM variadores v
JOIN variador_frames vf ON vf.id_variador = v.id_variador
JOIN frames f ON f.id_frame = vf.id_frame

UNION ALL

SELECT
  v.id_variador,
  v.referencia_interna,
  v.modelo,
  v.voltaje_nominal,
  v.potencia_nominal_kw,
  v.corriente_nominal,
  tc.codigo AS seccion,
  c.nombre_componente AS codigo,
  c.descripcion AS subtipo,
  vc.cantidad,
  c.ordering_code,
  vc.ubicacion_funcional AS ubicacion,
  vc.observaciones AS detalle
FROM variadores v
JOIN variador_componentes vc ON vc.id_variador = v.id_variador
JOIN componentes c ON c.id_componente = vc.id_componente
JOIN tipos_componentes tc ON tc.id_tipo_componente = c.id_tipo_componente

UNION ALL

SELECT
  v.id_variador,
  v.referencia_interna,
  v.modelo,
  v.voltaje_nominal,
  v.potencia_nominal_kw,
  v.corriente_nominal,
  'FILTER' AS seccion,
  fi.tipo_filtro AS codigo,
  c.nombre_componente AS subtipo,
  vf.cantidad,
  c.ordering_code,
  vf.ubicacion,
  fi.descripcion_tecnica AS detalle
FROM variadores v
JOIN variador_filtros vf ON vf.id_variador = v.id_variador
JOIN filtros fi ON fi.id_filtro = vf.id_filtro
JOIN componentes c ON c.id_componente = fi.id_componente

UNION ALL

SELECT
  v.id_variador,
  v.referencia_interna,
  v.modelo,
  v.voltaje_nominal,
  v.potencia_nominal_kw,
  v.corriente_nominal,
  'MECHANICAL' AS seccion,
  c.nombre_componente AS codigo,
  fa.observaciones AS subtipo,
  fa.cantidad,
  c.ordering_code,
  fa.ubicacion,
  fr.codigo_frame AS detalle
FROM variadores v
JOIN variador_frames vf ON vf.id_variador = v.id_variador
JOIN frames fr ON fr.id_frame = vf.id_frame
JOIN frame_accesorios fa ON fa.id_frame = fr.id_frame
JOIN componentes c ON c.id_componente = fa.id_componente;

-- Búsqueda por modelo o voltaje (RPC para PostgREST / supabase-js)
CREATE OR REPLACE FUNCTION buscar_variador (
  p_busqueda TEXT DEFAULT NULL,
  p_voltaje TEXT DEFAULT NULL
)
RETURNS TABLE (
  id_variador UUID,
  referencia_interna VARCHAR,
  modelo VARCHAR,
  voltaje_nominal VARCHAR,
  potencia_nominal_kw NUMERIC,
  corriente_nominal NUMERIC,
  seccion TEXT,
  codigo TEXT,
  subtipo TEXT,
  cantidad INT,
  ordering_code TEXT,
  ubicacion TEXT,
  detalle TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    l.id_variador,
    l.referencia_interna,
    l.modelo,
    l.voltaje_nominal,
    l.potencia_nominal_kw,
    l.corriente_nominal,
    l.seccion,
    l.codigo,
    l.subtipo,
    l.cantidad,
    l.ordering_code,
    l.ubicacion,
    l.detalle
  FROM v_configuracion_lineas l
  WHERE (
    p_busqueda IS NULL
    OR p_busqueda = ''
    OR l.referencia_interna ILIKE '%' || p_busqueda || '%'
    OR l.modelo ILIKE '%' || p_busqueda || '%'
  )
  AND (
    p_voltaje IS NULL
    OR p_voltaje = ''
    OR REPLACE(REPLACE(l.voltaje_nominal, 'V', ''), ' ', '') ILIKE '%' || REPLACE(REPLACE(p_voltaje, 'V', ''), ' ', '') || '%'
  )
  ORDER BY l.referencia_interna, l.seccion, l.codigo;
$$;

GRANT SELECT ON v_configuracion_lineas TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION buscar_variador (TEXT, TEXT) TO anon, authenticated, service_role;
