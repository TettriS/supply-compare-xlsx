import * as XLSX from "xlsx";
import type { ColumnRule, NormalizeResult } from "./types";

async function parseAndNormalizeFile(
  file: File,
  columns: ColumnRule[],
  sheetName?: string,
  headerOffset: number = 0,
): Promise<NormalizeResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheet = sheetName
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) throw new Error("Sheet not found");

  const aoa = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as any[][];

  if (!aoa.length) {
    return { headers: columns.map((c) => c.key), rows: [] };
  }

  const sourceHeaders = aoa[0 + headerOffset].map((v) => String(v).trim());
  const hasHeader = sourceHeaders.some((x) => x.length > 0);

  const dataRows = hasHeader ? aoa.slice(1) : aoa;

  const headerIndexMap = new Map<string, number>();
  sourceHeaders.forEach((h, i) => {
    if (h) headerIndexMap.set(h.toLowerCase(), i);
  });

  const rows = dataRows.map((row) => {
    const out: Record<string, string> = {};

    for (const col of columns) {
      let idx = col.index;

      if (idx === undefined && col.name) {
        idx = headerIndexMap.get(col.name.toLowerCase());
      }

      const value = idx !== undefined ? row[idx] ?? "" : "";
      out[col.key] = String(value);
    }

    return out;
  });

  return {
    headers: columns.map((c) => c.key),
    rows,
  };
}

export default parseAndNormalizeFile
