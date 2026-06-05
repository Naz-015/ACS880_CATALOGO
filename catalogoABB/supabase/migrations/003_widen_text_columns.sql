-- Textos largos del Excel (ubicación funcional de filtros, etc.)
ALTER TABLE variador_filtros
  ALTER COLUMN ubicacion TYPE TEXT;

ALTER TABLE variador_filtros
  ADD COLUMN IF NOT EXISTS observaciones TEXT;
