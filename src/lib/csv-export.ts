/**
 * CSV Export Utility
 * Converts an array of objects to CSV and triggers download.
 */

export function exportToCSV(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data || data.length === 0) return;

  // Determine columns: use provided or infer from first row
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  // Build CSV header
  const header = cols.map(c => `"${c.label}"`).join(',');

  // Build CSV rows
  const rows = data.map(row => {
    return cols.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape quotes
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
