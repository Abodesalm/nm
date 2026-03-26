import * as XLSX from "xlsx-js-style";

export function downloadXLSX(rows: Record<string, any>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);

  const range = XLSX.utils.decode_range(ws["!ref"]!);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[ref]) continue;
      ws[ref].s = {
        alignment: { horizontal: "center", vertical: "center", wrapText: false },
        font: R === 0 ? { bold: true } : {},
      };
    }
  }

  // Set all columns to ~2 inches wide (20 chars ≈ 2")
  const colCount = range.e.c - range.s.c + 1;
  ws["!cols"] = Array.from({ length: colCount }, () => ({ wch: 20 }));

  // Set all rows to ~0.40 inches tall (29 pt = 0.40")
  const rowCount = range.e.r - range.s.r + 1;
  ws["!rows"] = Array.from({ length: rowCount }, () => ({ hpt: 29 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
