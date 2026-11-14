/**
 * Utilidades puras para exportación e importación en formato CSV estándar (RFC 4180).
 * Diseñadas para ser agnósticas de plataforma, dominio y base de datos, con protección contra inyección de fórmulas (CWE-1236).
 */

/**
 * Escapa y formatea un valor para una celda de CSV según RFC 4180, protegiendo contra inyección de fórmulas (CWE-1236).
 *
 * @param val Valor primitivo o textual de la celda.
 * @returns Cadena escapada lista para concatenar en una fila CSV.
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Mitigación de inyección de fórmulas en hojas de cálculo si el valor textual empieza por =, +, -, @ o tab
  if (typeof val === 'string' && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Parsea un contenido de texto CSV según la especificación RFC 4180 soportando celdas multilínea,
 * comillas y autodetección de delimitador (, ; \t) para compatibilidad con Excel europeo y Cardmarket.
 *
 * @param text Cadena de texto completa en formato CSV.
 * @param delimiter Delimitador opcional; si se omite, se autodetecta entre ',', ';' y '\t'.
 * @returns Matriz bidimensional de celdas (filas y columnas).
 */
export function parseCsvRows(text: string, delimiter?: string): string[][] {
  let delim = delimiter;
  if (!delim) {
    const firstLine = text.split(/[\r\n]+/)[0] ?? '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount > tabCount) {
      delim = ';';
    } else if (tabCount > commaCount && tabCount > semiCount) {
      delim = '\t';
    } else {
      delim = ',';
    }
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          currentCell += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delim) {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < len && text[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}
