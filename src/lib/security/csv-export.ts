/**
 * RFC 4180 Compliant CSV Serializer with Spreadsheet Formula Injection (CSV Injection) Mitigation.
 * OWASP Reference: Formula Injection occurs when untrusted user input starts with =, +, -, @, \t, or \r.
 * We neutralize this by prefixing such cells with a single quote (').
 */

export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // If cell starts with formula characters, prefix with single quote to neutralize execution in Excel/Calc
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If string contains comma, double-quote, or newline, escape double quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsv<T extends Record<string, any>>(
  data: T[],
  columns: { header: string; key: keyof T | ((item: T) => any) }[],
): string {
  const headerRow = columns.map((col) => sanitizeCsvField(col.header)).join(",");

  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const val = typeof col.key === "function" ? col.key(item) : item[col.key];
        return sanitizeCsvField(val);
      })
      .join(",");
  });

  return [headerRow, ...rows].join("\r\n");
}
