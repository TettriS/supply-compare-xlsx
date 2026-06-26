import * as XLSX from "xlsx";
import type { NormalizeResult } from "./types";


function exportNormalizeResultToXlsx(
  result: NormalizeResult,
  fileName = "result",
  sheetName = "Result"
) {
  const worksheet = XLSX.utils.json_to_sheet(result.rows, {
    header: result.headers,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFileXLSX(workbook, `${fileName}.xlsx`, { compression: true });
}

export default exportNormalizeResultToXlsx
