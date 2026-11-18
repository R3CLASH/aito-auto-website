/**
 * Minimal CSV serialisation.
 *
 * The output is aimed at Excel, which is where a car dealer opens a
 * spreadsheet. Two details matter for that:
 *
 *   - The delimiter. Excel splits on the list separator of the machine's
 *     locale, which is a semicolon across most of Europe, Finland included. A
 *     comma-separated file opens there as one column of mush, so semicolon is
 *     the default and `,` stays available for everything else.
 *   - The byte order mark. Without it Excel reads the file as the legacy
 *     Windows code page and "Sähkö" arrives as "SÃ¤hkÃ¶".
 */
export const BOM = '﻿';

export type CsvValue = string | number | boolean | null | undefined;

/** One field, escaped per RFC 4180: quote when needed, double the quotes. */
export function csvField(value: CsvValue, delimiter: string): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'boolean') return value ? 'kyllä' : 'ei';

  const str = String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula, so prefix
  // a quote character: the cell still reads normally, nothing executes.
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;

  return /["\r\n]|[,;\t]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Header row plus body, CRLF terminated, with the BOM Excel needs. */
export function toCsv(
  headers: string[],
  rows: CsvValue[][],
  delimiter: string = ';'
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => csvField(cell, delimiter)).join(delimiter)
  );
  return BOM + lines.join('\r\n') + '\r\n';
}

/**
 * Flatten a Strapi blocks field to a single line of readable text, so a
 * description survives the trip into a spreadsheet cell.
 */
export function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';

  const walk = (node: any): string => {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.children)) return node.children.map(walk).join('');
    return '';
  };

  return blocks
    .map(walk)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' — ')
    .replace(/\s+/g, ' ')
    .trim();
}
