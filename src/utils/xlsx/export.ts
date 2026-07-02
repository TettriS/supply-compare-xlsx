import * as XLSX from "xlsx";
import type { NormalizeResult } from "./types";


function exportNormalizeResultToXlsx(
  results: NormalizeResult[],
  fileName = "result",
  sheetNames: string[] = ["Result"]
) {
  const workbook = XLSX.utils.book_new();

  results.forEach((result, index) => {
    const worksheet = XLSX.utils.json_to_sheet(result.rows, {
      header: result.headers,
    });

    worksheet['!cols'] = result.headers.map<XLSX.ColInfo>(() => ({wch: 20}));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetNames[index]);
  });

  XLSX.writeFileXLSX(workbook, `${fileName}.xlsx`, { compression: true });
}

export default exportNormalizeResultToXlsx
