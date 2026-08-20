// Minimal RFC-4180-ish CSV parser: handles quoted fields, embedded commas,
// and doubled-quote escaping ("" -> "). Good enough for the docs/google-ads
// CSVs, which are all double-quoted and machine-generated.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    if (row.length > 1 || row[0] !== '') {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushField();
      pushRow();
    } else if (char === '\r') {
      // skip; \n handles the row break
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    pushField();
    pushRow();
  }

  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((key, idx) => [key, r[idx] ?? ''])));
}
