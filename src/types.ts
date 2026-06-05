export type DutyMode = 'normal' | 'heavy' | 'light';
export type PowerUnit = 'kw' | 'hp' | 'kva';

export interface DriveSummary {
  id_variador: string;
  referencia_interna: string;
  modelo: string;
  voltaje_nominal: string | null;
  corriente_nominal: number | null;
  corriente_max: number | null;
  corriente_normal_duty_a?: number | null;
  corriente_heavy_duty_a?: number | null;
  corriente_light_duty_a?: number | null;
  potencia_nominal_kw: number | null;
  potencia_heavy_duty_kw: number | null;
  potencia_normal_duty_kw?: number | null;
  potencia_light_duty_kw?: number | null;
  potencia_nominal_hp?: number | null;
  potencia_nominal_kva?: number | null;
  p_loss_kw?: number | null;
  airflow_m3h?: number | null;
  noise_db?: number | null;
  version_catalogo?: string | null;
  manual_origen?: string | null;
  estado?: string | null;
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
