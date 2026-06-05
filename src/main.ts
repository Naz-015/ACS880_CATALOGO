import './styles.css';
import { getDriveDetail, searchByCurrent, searchByModel, searchByPower } from './search';
import type { DriveDetail, DriveSummary, DutyMode, PowerUnit, SearchResult } from './types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('No se encontró el contenedor #app');
}

let currentResults: DriveSummary[] = [];
let activeMode: 'model' | 'current' | 'power' = 'model';

app.innerHTML = `
  <header class="topbar">
    <div>
      <p class="eyebrow">Catálogo técnico local</p>
      <h1>ABB Drive Catalog</h1>
    </div>
    <div class="status-pill">Supabase</div>
  </header>

  <main class="layout">
    <section class="card search-card">
      <div class="tabs" role="tablist">
        <button class="tab active" data-mode="model">Buscar por modelo</button>
        <button class="tab" data-mode="current">Buscar por corriente</button>
        <button class="tab" data-mode="power">Buscar por potencia</button>
      </div>

      <form id="search-form" class="search-form">
        <div id="form-fields"></div>
        <button class="primary-button" type="submit">Buscar</button>
      </form>

      <p id="message" class="message" aria-live="polite"></p>
    </section>

    <section class="card results-card">
      <div class="section-title">
        <h2>Resultados</h2>
        <span id="result-count">0</span>
      </div>
      <div id="results" class="table-wrapper empty-state">Sin búsqueda ejecutada.</div>
    </section>

    <section class="card detail-card">
      <div class="section-title">
        <h2>Detalle técnico</h2>
      </div>
      <div id="detail" class="empty-state">Seleccione un resultado para ver el detalle.</div>
    </section>
  </main>
`;

const formFields = document.querySelector<HTMLDivElement>('#form-fields')!;
const form = document.querySelector<HTMLFormElement>('#search-form')!;
const messageEl = document.querySelector<HTMLParagraphElement>('#message')!;
const resultsEl = document.querySelector<HTMLDivElement>('#results')!;
const resultCountEl = document.querySelector<HTMLSpanElement>('#result-count')!;
const detailEl = document.querySelector<HTMLDivElement>('#detail')!;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));

renderFields();

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    activeMode = tab.dataset.mode as typeof activeMode;
    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    renderFields();
    clearResults();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('Cargando...', 'info');
  resultsEl.innerHTML = 'Cargando...';
  resultsEl.className = 'table-wrapper empty-state';
  detailEl.innerHTML = 'Seleccione un resultado para ver el detalle.';
  detailEl.className = 'empty-state';

  try {
    let result: SearchResult;

    if (activeMode === 'model') {
      const model = getInputValue('model-input');
      result = await searchByModel(model);
    } else if (activeMode === 'current') {
      const amps = Number(getInputValue('current-input'));
      const duty = getInputValue('duty-select') as DutyMode;
      if (!Number.isFinite(amps) || amps <= 0) {
        setMessage('Ingrese una corriente válida en amperios.', 'warning');
        clearResults();
        return;
      }
      result = await searchByCurrent(amps, duty);
    } else {
      const power = Number(getInputValue('power-input'));
      const unit = getInputValue('unit-select') as PowerUnit;
      if (!Number.isFinite(power) || power <= 0) {
        setMessage('Ingrese una potencia válida.', 'warning');
        clearResults();
        return;
      }
      result = await searchByPower(power, unit);
    }

    currentResults = result.rows;
    renderResults(currentResults);

    if (result.rows.length === 0) {
      setMessage('No se encontraron resultados', 'warning');
    } else if (result.warning) {
      setMessage(result.warning, 'warning');
    } else {
      setMessage(`Resultados cargados desde ${result.source === 'view' ? 'vista' : 'tabla'}.`, 'success');
    }
  } catch (error) {
    console.error(error);
    setMessage('Error consultando Supabase', 'error');
    resultsEl.innerHTML = 'Error consultando Supabase';
    resultsEl.className = 'table-wrapper empty-state';
  }
});

function renderFields(): void {
  if (activeMode === 'model') {
    formFields.innerHTML = `
      <label class="field">
        <span>Modelo o referencia</span>
        <input id="model-input" type="text" placeholder="Ej. ACS880-04-0800A-7" autocomplete="off" />
      </label>
    `;
    return;
  }

  if (activeMode === 'current') {
    formFields.innerHTML = `
      <div class="grid-2">
        <label class="field">
          <span>Corriente [A]</span>
          <input id="current-input" type="number" min="0" step="0.1" placeholder="Ej. 1200" />
        </label>
        <label class="field">
          <span>Duty</span>
          <select id="duty-select">
            <option value="normal">Normal Duty</option>
            <option value="heavy">Heavy Duty</option>
            <option value="light">Light Duty</option>
          </select>
        </label>
      </div>
    `;
    return;
  }

  formFields.innerHTML = `
    <div class="grid-2">
      <label class="field">
        <span>Potencia</span>
        <input id="power-input" type="number" min="0" step="0.1" placeholder="Ej. 500" />
      </label>
      <label class="field">
        <span>Unidad</span>
        <select id="unit-select">
          <option value="kw">kW</option>
          <option value="hp">HP</option>
          <option value="kva">kVA</option>
        </select>
      </label>
    </div>
  `;
}

function getInputValue(id: string): string {
  const input = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  return input?.value.trim() ?? '';
}

function clearResults(): void {
  currentResults = [];
  resultCountEl.textContent = '0';
  resultsEl.innerHTML = 'Sin búsqueda ejecutada.';
  resultsEl.className = 'table-wrapper empty-state';
  detailEl.innerHTML = 'Seleccione un resultado para ver el detalle.';
  detailEl.className = 'empty-state';
  setMessage('', 'info');
}

function renderResults(rows: DriveSummary[]): void {
  resultCountEl.textContent = String(rows.length);

  if (rows.length === 0) {
    resultsEl.innerHTML = 'No se encontraron resultados';
    resultsEl.className = 'table-wrapper empty-state';
    return;
  }

  resultsEl.className = 'table-wrapper';
  resultsEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Referencia</th>
          <th>Modelo</th>
          <th>Voltaje</th>
          <th>I nom. [A]</th>
          <th>I max. [A]</th>
          <th>kW nom.</th>
          <th>Frames</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row, index) => `
              <tr data-index="${index}">
                <td>${value(row.referencia_interna)}</td>
                <td>${value(row.modelo)}</td>
                <td>${value(row.voltaje_nominal)}</td>
                <td>${value(row.corriente_nominal)}</td>
                <td>${value(row.corriente_max)}</td>
                <td>${value(row.potencia_nominal_kw)}</td>
                <td>${value(row.frame_configuracion)}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;

  resultsEl.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
    row.addEventListener('click', async () => {
      resultsEl.querySelectorAll('tr').forEach((tr) => tr.classList.remove('selected'));
      row.classList.add('selected');
      const index = Number(row.dataset.index);
      const selected = currentResults[index];
      if (!selected) return;
      await renderDetail(selected);
    });
  });
}

async function renderDetail(row: DriveSummary): Promise<void> {
  detailEl.className = 'empty-state';
  detailEl.innerHTML = 'Cargando...';

  try {
    const detail = await getDriveDetail(row.id_variador, row);
    detailEl.className = 'detail-content';
    detailEl.innerHTML = buildDetailHtml(detail);
  } catch (error) {
    console.error(error);
    detailEl.className = 'empty-state';
    detailEl.innerHTML = 'Error consultando Supabase';
  }
}

function buildDetailHtml(detail: DriveDetail): string {
  const drive = detail.drive;

  return `
    <div class="detail-header">
      <div>
        <p class="eyebrow">Referencia interna</p>
        <h3>${value(drive.referencia_interna)}</h3>
      </div>
      <span class="abb-badge">ABB ACS880</span>
    </div>

    <div class="detail-grid">
      ${metric('Modelo', drive.modelo)}
      ${metric('Voltaje nominal', drive.voltaje_nominal)}
      ${metric('Corriente nominal [A]', drive.corriente_nominal)}
      ${metric('Corriente máxima [A]', drive.corriente_max)}
      ${metric('Normal Duty [A]', drive.corriente_normal_duty_a)}
      ${metric('Heavy Duty [A]', drive.corriente_heavy_duty_a)}
      ${metric('Light Duty [A]', drive.corriente_light_duty_a)}
      ${metric('Potencia nominal [kW]', drive.potencia_nominal_kw)}
      ${metric('Potencia Heavy Duty [kW]', drive.potencia_heavy_duty_kw)}
      ${metric('Potencia [HP]', drive.potencia_nominal_hp)}
      ${metric('Potencia [kVA]', drive.potencia_nominal_kva)}
      ${metric('P_loss [kW]', drive.p_loss_kw)}
      ${metric('Airflow [m³/h]', drive.airflow_m3h)}
      ${metric('Noise [dB]', drive.noise_db)}
      ${metric('Configuración frames', drive.frame_configuracion)}
      ${metric('Versión catálogo', drive.version_catalogo)}
    </div>

    ${sectionTable(
      'Detalle de frames',
      ['Frame', 'Cant.', 'Pos.', 'Alto', 'Ancho', 'Prof.', 'Peso', 'Distancia seguridad'],
      detail.frames.map((frame) => [
        frame.codigo_frame,
        frame.cantidad,
        frame.posicion,
        formatUnit(frame.alto_mm, 'mm'),
        formatUnit(frame.ancho_mm, 'mm'),
        formatUnit(frame.profundidad_mm, 'mm'),
        formatUnit(frame.peso_kg, 'kg'),
        frame.safety_distance_mm ? formatUnit(frame.safety_distance_mm, 'mm') : frame.safety_distance_note
      ])
    )}

    ${sectionTable(
      'Componentes asociados',
      ['Código', 'Nombre', 'Tipo', 'Fabricante', 'Cant.', 'Ubicación'],
      detail.componentes.map((item) => [
        item.ordering_code,
        item.nombre_componente,
        item.tipo_componente,
        item.fabricante,
        item.cantidad,
        item.ubicacion_funcional
      ])
    )}

    ${sectionTable(
      'Filtros asociados',
      ['Código', 'Nombre', 'Tipo filtro', 'Cant.', 'Ubicación', 'Instalación'],
      detail.filtros.map((item) => [
        item.ordering_code,
        item.nombre_componente,
        item.tipo_filtro,
        item.cantidad,
        item.ubicacion,
        item.tipo_instalacion
      ])
    )}
  `;
}

function sectionTable(title: string, headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  if (rows.length === 0) {
    return `
      <section class="subsection">
        <h4>${escapeHtml(title)}</h4>
        <p class="empty-line">Dato no disponible</p>
      </section>
    `;
  }

  return `
    <section class="subsection">
      <h4>${escapeHtml(title)}</h4>
      <div class="table-wrapper small-table">
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => `<tr>${row.map((cell) => `<td>${value(cell)}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function metric(label: string, rawValue: string | number | null | undefined): string {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value(rawValue)}</strong>
    </div>
  `;
}

function formatUnit(rawValue: number | null | undefined, unit: string): string | null {
  if (rawValue === null || rawValue === undefined) return null;
  return `${rawValue} ${unit}`;
}

function value(rawValue: string | number | null | undefined): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') return '<span class="muted">Dato no disponible</span>';
  return escapeHtml(String(rawValue));
}

function setMessage(text: string, type: 'info' | 'success' | 'warning' | 'error'): void {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
