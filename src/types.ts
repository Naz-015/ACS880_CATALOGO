export type DutyMode = 'normal' | 'heavy' | 'light';
export type PowerUnit = 'kw' | 'hp' | 'kva';

export interface DriveSummary {
  id_variador: string;
  referencia_interna: string;
  modelo: string;
  voltaje_nominal: string | null;

  // Normal data
  corriente_nominal: number | null;      // I_N
  corriente_max: number | null;          // Imax
  corriente_i1_a?: number | null;        // I_1
  potencia_nominal_kw: number | null;    // P_N
  potencia_nominal_kva?: number | null;  // S_N

  // Light-overload use
  corriente_light_duty_a?: number | null; // I_ld
  potencia_light_duty_kw?: number | null; // P_ld

  // Heavy duty use
  corriente_heavy_duty_a?: number | null; // I_Hd
  potencia_heavy_duty_kw: number | null;  // P_Hd

  // Campos auxiliares / compatibilidad
  corriente_normal_duty_a?: number | null;
  potencia_normal_duty_kw?: number | null;
  potencia_nominal_hp?: number | null;

  // Datos adicionales
  p_loss_kw?: number | null;
  airflow_m3h?: number | null;
  noise_db?: number | null;
  version_catalogo?: string | null;
  manual_origen?: string | null;
  estado?: string | null;

  // La vista nueva usa este nombre
  configuracion_frames?: string | null;

  // Lo dejamos por compatibilidad con código anterior
  frame_configuracion?: string | null;
}

export interface FrameDetail {
  id_frame?: string | null;
  codigo_frame: string | null;
  categoria?: string | null;
  cantidad: number | null;
  posicion: number | null;
  alto_mm: number | null;
  ancho_mm: number | null;
  profundidad_mm: number | null;
  peso_kg: number | null;
  grado_proteccion?: string | null;
  safety_distance_mm?: number | null;
  safety_distance_note?: string | null;
  airflow_m3h?: number | null;
  noise_db?: number | null;
  perdidas_w?: number | null;
}

export interface ComponentDetail {
  ordering_code: string | null;
  nombre_componente: string | null;
  tipo_componente?: string | null;
  fabricante?: string | null;
  cantidad: number | null;
  ubicacion_funcional?: string | null;
  observaciones?: string | null;
}

export interface FilterDetail {
  ordering_code: string | null;
  nombre_componente: string | null;
  tipo_filtro: string | null;
  cantidad: number | null;
  ubicacion?: string | null;
  tipo_instalacion?: string | null;
  descripcion_tecnica?: string | null;
  observaciones?: string | null;
}

export interface DriveDetail {
  drive: DriveSummary;
  frames: FrameDetail[];
  componentes: ComponentDetail[];
  filtros: FilterDetail[];
}

export interface SearchResult {
  rows: DriveSummary[];
  source: 'view' | 'table';
  warning?: string;
}
