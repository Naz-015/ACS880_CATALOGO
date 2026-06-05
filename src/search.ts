import { supabase } from './supabaseClient';
import type {
  ComponentDetail,
  DriveDetail,
  DriveSummary,
  DutyMode,
  FilterDetail,
  FrameDetail,
  PowerUnit,
  SearchResult
} from './types';

const DRIVE_VIEW = 'v_variadores_resumen';
const DRIVE_TABLE = 'variadores';

function cleanSearchTerm(value: string): string {
  return value.trim().replaceAll(',', ' ').replaceAll('%', '').replaceAll('*', '');
}

function isMissingRelationError(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes('does not exist') ||
    text.includes('could not find') ||
    text.includes('schema cache') ||
    text.includes('column') ||
    text.includes('relation')
  );
}

function normalizeDrive(row: Record<string, unknown>): DriveSummary {
  return {
    id_variador: String(row.id_variador),
    referencia_interna: String(row.referencia_interna ?? ''),
    modelo: String(row.modelo ?? ''),
    voltaje_nominal: (row.voltaje_nominal as string | null) ?? null,
    corriente_nominal: toNumber(row.corriente_nominal),
    corriente_max: toNumber(row.corriente_max),
    corriente_normal_duty_a: toNumber(row.corriente_normal_duty_a) ?? toNumber(row.corriente_nominal),
    corriente_heavy_duty_a: toNumber(row.corriente_heavy_duty_a) ?? toNumber(row.corriente_max),
    corriente_light_duty_a: toNumber(row.corriente_light_duty_a),
    potencia_nominal_kw: toNumber(row.potencia_nominal_kw),
    potencia_heavy_duty_kw: toNumber(row.potencia_heavy_duty_kw),
    potencia_normal_duty_kw: toNumber(row.potencia_normal_duty_kw) ?? toNumber(row.potencia_nominal_kw),
    potencia_light_duty_kw: toNumber(row.potencia_light_duty_kw),
    potencia_nominal_hp: toNumber(row.potencia_nominal_hp),
    potencia_nominal_kva: toNumber(row.potencia_nominal_kva),
    p_loss_kw: toNumber(row.p_loss_kw),
    airflow_m3h: toNumber(row.airflow_m3h),
    noise_db: toNumber(row.noise_db),
    version_catalogo: (row.version_catalogo as string | null) ?? null,
    manual_origen: (row.manual_origen as string | null) ?? null,
    estado: (row.estado as string | null) ?? null,
    frame_configuracion: (row.frame_configuracion as string | null) ?? null
  };
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstObject<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function queryViewOrTable(
  viewQuery: () => Promise<{ data: unknown[] | null; error: { message: string } | null }>,
  tableQuery: () => Promise<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<SearchResult> {
  const viewResult = await viewQuery();

  if (!viewResult.error) {
    return {
      rows: (viewResult.data ?? []).map((row) => normalizeDrive(row as Record<string, unknown>)),
      source: 'view'
    };
  }

  if (!isMissingRelationError(viewResult.error.message)) {
    throw new Error(viewResult.error.message);
  }

  const tableResult = await tableQuery();

  if (tableResult.error) {
    throw new Error(tableResult.error.message);
  }

  return {
    rows: (tableResult.data ?? []).map((row) => normalizeDrive(row as Record<string, unknown>)),
    source: 'table',
    warning: `No se encontró ${DRIVE_VIEW}. Se consultó directamente la tabla ${DRIVE_TABLE}.`
  };
}

export async function searchByModel(input: string): Promise<SearchResult> {
  const term = cleanSearchTerm(input);
  if (!term) return { rows: [], source: 'table' };

  const filter = `referencia_interna.ilike.%${term}%,modelo.ilike.%${term}%`;

  return queryViewOrTable(
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_VIEW)
        .select('*')
        .or(filter)
        .limit(50);
      return { data, error };
    },
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_TABLE)
        .select('*')
        .or(filter)
        .limit(50);
      return { data, error };
    }
  );
}

export async function searchByCurrent(amps: number, duty: DutyMode): Promise<SearchResult> {
  const viewColumnByDuty: Record<DutyMode, string> = {
    normal: 'corriente_busqueda_normal_a',
    heavy: 'corriente_busqueda_heavy_a',
    light: 'corriente_light_duty_a'
  };

  const tableColumnByDuty: Record<DutyMode, string> = {
    normal: 'corriente_nominal',
    heavy: 'corriente_max',
    light: 'corriente_light_duty_a'
  };

  const viewColumn = viewColumnByDuty[duty];
  const tableColumn = tableColumnByDuty[duty];

  return queryViewOrTable(
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_VIEW)
        .select('*')
        .gte(viewColumn, amps)
        .lte(viewColumn, amps * 1.5)
        .order(viewColumn, { ascending: true })
        .limit(100);
      return { data, error };
    },
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_TABLE)
        .select('*')
        .gte(tableColumn, amps)
        .lte(tableColumn, amps * 1.5)
        .order(tableColumn, { ascending: true })
        .limit(100);
      return { data, error };
    }
  );
}

export async function searchByPower(value: number, unit: PowerUnit): Promise<SearchResult> {
  const viewColumnByUnit: Record<PowerUnit, string> = {
    kw: 'potencia_busqueda_kw',
    hp: 'potencia_nominal_hp',
    kva: 'potencia_nominal_kva'
  };

  const tableColumnByUnit: Record<PowerUnit, string> = {
    kw: 'potencia_nominal_kw',
    hp: 'potencia_nominal_hp',
    kva: 'potencia_nominal_kva'
  };

  const viewColumn = viewColumnByUnit[unit];
  const tableColumn = tableColumnByUnit[unit];

  return queryViewOrTable(
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_VIEW)
        .select('*')
        .gte(viewColumn, value)
        .lte(viewColumn, value * 1.5)
        .order(viewColumn, { ascending: true })
        .limit(100);
      return { data, error };
    },
    async () => {
      const { data, error } = await supabase
        .from(DRIVE_TABLE)
        .select('*')
        .gte(tableColumn, value)
        .lte(tableColumn, value * 1.5)
        .order(tableColumn, { ascending: true })
        .limit(100);
      return { data, error };
    }
  );
}

export async function getDriveDetail(idVariador: string, existingDrive?: DriveSummary): Promise<DriveDetail> {
  const drive = existingDrive ?? (await getDriveById(idVariador));
  const [frames, componentes, filtros] = await Promise.all([
    getFramesDetail(idVariador),
    getComponentsDetail(idVariador),
    getFiltersDetail(idVariador)
  ]);

  if (!drive.frame_configuracion) {
    drive.frame_configuracion = buildFrameConfiguration(frames);
  }

  return { drive, frames, componentes, filtros };
}

async function getDriveById(idVariador: string): Promise<DriveSummary> {
  const { data: viewData, error: viewError } = await supabase
    .from(DRIVE_VIEW)
    .select('*')
    .eq('id_variador', idVariador)
    .maybeSingle();

  if (!viewError && viewData) {
    return normalizeDrive(viewData as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from(DRIVE_TABLE)
    .select('*')
    .eq('id_variador', idVariador)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se encontró el variador seleccionado');
  }

  return normalizeDrive(data as Record<string, unknown>);
}

async function getFramesDetail(idVariador: string): Promise<FrameDetail[]> {
  const { data: viewData, error: viewError } = await supabase
    .from('v_variador_frames_detalle')
    .select('*')
    .eq('id_variador', idVariador)
    .order('posicion', { ascending: true });

  if (!viewError && viewData) {
    return (viewData as Record<string, unknown>[]).map((row) => ({
      id_frame: (row.id_frame as string | null) ?? null,
      codigo_frame: (row.codigo_frame as string | null) ?? null,
      categoria: (row.categoria as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      posicion: toNumber(row.posicion),
      alto_mm: toNumber(row.alto_mm),
      ancho_mm: toNumber(row.ancho_mm),
      profundidad_mm: toNumber(row.profundidad_mm),
      peso_kg: toNumber(row.peso_kg),
      grado_proteccion: (row.grado_proteccion as string | null) ?? null,
      safety_distance_mm: toNumber(row.safety_distance_mm),
      safety_distance_note: (row.safety_distance_note as string | null) ?? null,
      airflow_m3h: toNumber(row.airflow_m3h),
      noise_db: toNumber(row.noise_db),
      perdidas_w: toNumber(row.perdidas_w)
    }));
  }

  const { data: frameRows, error: frameError } = await supabase
    .from('variador_frames')
    .select(`
      cantidad,
      posicion,
      observaciones,
      frames (
        id_frame,
        codigo_frame,
        categoria,
        safety_distance_mm,
        safety_distance_note
      )
    `)
    .eq('id_variador', idVariador)
    .order('posicion', { ascending: true });

  if (frameError) {
    return [];
  }

  const rows = (frameRows ?? []) as Array<Record<string, unknown>>;
  const frameIds = rows
    .map((row) => firstObject(row.frames as Record<string, unknown> | Record<string, unknown>[] | null)?.id_frame)
    .filter(Boolean) as string[];

  const specsByFrame = new Map<string, Record<string, unknown>>();

  if (frameIds.length > 0) {
    const { data: specRows } = await supabase
      .from('frame_specs')
      .select('*')
      .in('id_frame', frameIds);

    for (const spec of (specRows ?? []) as Array<Record<string, unknown>>) {
      const frameId = String(spec.id_frame);
      if (!specsByFrame.has(frameId)) specsByFrame.set(frameId, spec);
    }
  }

  return rows.map((row) => {
    const frame = firstObject(row.frames as Record<string, unknown> | Record<string, unknown>[] | null);
    const frameId = frame?.id_frame ? String(frame.id_frame) : '';
    const spec = specsByFrame.get(frameId);

    return {
      id_frame: frameId || null,
      codigo_frame: (frame?.codigo_frame as string | null) ?? null,
      categoria: (frame?.categoria as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      posicion: toNumber(row.posicion),
      alto_mm: toNumber(spec?.alto_mm),
      ancho_mm: toNumber(spec?.ancho_mm),
      profundidad_mm: toNumber(spec?.profundidad_mm),
      peso_kg: toNumber(spec?.peso_kg),
      grado_proteccion: (spec?.grado_proteccion as string | null) ?? null,
      safety_distance_mm: toNumber(frame?.safety_distance_mm) ?? toNumber(spec?.safety_distance_mm),
      safety_distance_note: (frame?.safety_distance_note as string | null) ?? (spec?.safety_distance_note as string | null) ?? null,
      airflow_m3h: toNumber(spec?.airflow_m3h),
      noise_db: toNumber(spec?.noise_db),
      perdidas_w: toNumber(spec?.perdidas_w)
    };
  });
}

async function getComponentsDetail(idVariador: string): Promise<ComponentDetail[]> {
  const { data: viewData, error: viewError } = await supabase
    .from('v_variador_componentes_detalle')
    .select('*')
    .eq('id_variador', idVariador)
    .order('ordering_code', { ascending: true });

  if (!viewError && viewData) {
    return (viewData as Record<string, unknown>[]).map((row) => ({
      ordering_code: (row.ordering_code as string | null) ?? null,
      nombre_componente: (row.nombre_componente as string | null) ?? null,
      tipo_componente: (row.tipo_componente as string | null) ?? null,
      fabricante: (row.fabricante as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      ubicacion_funcional: (row.ubicacion_funcional as string | null) ?? null,
      observaciones: (row.observaciones as string | null) ?? null
    }));
  }

  const { data, error } = await supabase
    .from('variador_componentes')
    .select(`
      cantidad,
      ubicacion_funcional,
      observaciones,
      componentes (
        ordering_code,
        nombre_componente,
        fabricante,
        descripcion,
        tipos_componentes (
          codigo,
          descripcion
        )
      )
    `)
    .eq('id_variador', idVariador);

  if (error) return [];

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const comp = firstObject(row.componentes as Record<string, unknown> | Record<string, unknown>[] | null);
    const tipo = firstObject(comp?.tipos_componentes as Record<string, unknown> | Record<string, unknown>[] | null);
    return {
      ordering_code: (comp?.ordering_code as string | null) ?? null,
      nombre_componente: (comp?.nombre_componente as string | null) ?? null,
      tipo_componente: (tipo?.codigo as string | null) ?? null,
      fabricante: (comp?.fabricante as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      ubicacion_funcional: (row.ubicacion_funcional as string | null) ?? null,
      observaciones: (row.observaciones as string | null) ?? null
    };
  });
}

async function getFiltersDetail(idVariador: string): Promise<FilterDetail[]> {
  const { data: viewData, error: viewError } = await supabase
    .from('v_variador_filtros_detalle')
    .select('*')
    .eq('id_variador', idVariador)
    .order('tipo_filtro', { ascending: true });

  if (!viewError && viewData) {
    return (viewData as Record<string, unknown>[]).map((row) => ({
      ordering_code: (row.ordering_code as string | null) ?? null,
      nombre_componente: (row.nombre_componente as string | null) ?? null,
      tipo_filtro: (row.tipo_filtro as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      ubicacion: (row.ubicacion as string | null) ?? null,
      tipo_instalacion: (row.tipo_instalacion as string | null) ?? null,
      descripcion_tecnica: (row.descripcion_tecnica as string | null) ?? null,
      observaciones: (row.observaciones as string | null) ?? null
    }));
  }

  const { data, error } = await supabase
    .from('variador_filtros')
    .select(`
      cantidad,
      ubicacion,
      tipo_instalacion,
      observaciones,
      filtros (
        tipo_filtro,
        descripcion_tecnica,
        componentes (
          ordering_code,
          nombre_componente
        )
      )
    `)
    .eq('id_variador', idVariador);

  if (error) return [];

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const filtro = firstObject(row.filtros as Record<string, unknown> | Record<string, unknown>[] | null);
    const comp = firstObject(filtro?.componentes as Record<string, unknown> | Record<string, unknown>[] | null);
    return {
      ordering_code: (comp?.ordering_code as string | null) ?? null,
      nombre_componente: (comp?.nombre_componente as string | null) ?? null,
      tipo_filtro: (filtro?.tipo_filtro as string | null) ?? null,
      cantidad: toNumber(row.cantidad),
      ubicacion: (row.ubicacion as string | null) ?? null,
      tipo_instalacion: (row.tipo_instalacion as string | null) ?? null,
      descripcion_tecnica: (filtro?.descripcion_tecnica as string | null) ?? null,
      observaciones: (row.observaciones as string | null) ?? null
    };
  });
}

export function buildFrameConfiguration(frames: FrameDetail[]): string {
  if (frames.length === 0) return 'Dato no disponible';
  return frames
    .slice()
    .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
    .map((frame) => `${frame.cantidad ?? 1}x${frame.codigo_frame ?? 'N/D'}`)
    .join(' + ');
}
