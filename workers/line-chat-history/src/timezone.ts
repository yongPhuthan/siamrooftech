/**
 * Resolves a query into a UTC millisecond range [fromMs, toMs).
 *
 * `date` + `timezone` resolves to the local calendar day's [00:00:00, 24:00:00)
 * window converted to UTC. `from`/`to` are taken as literal ISO 8601 instants.
 * SQLite has no timezone database, so this conversion happens in the Worker
 * (which has full ICU) and the resulting UTC ms bounds are compared against
 * the indexed `occurred_at` column.
 */
export function resolveTimeRange(params: {
  date?: string | null;
  from?: string | null;
  to?: string | null;
  timezone?: string | null;
}): { fromMs: number; toMs: number; timezone: string } {
  const timezone = params.timezone || 'Asia/Bangkok';

  if (params.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      throw new RangeError('date must be in YYYY-MM-DD format');
    }
    const fromMs = localDateToUtcMs(params.date, timezone);
    const toMs = localDateToUtcMs(addDays(params.date, 1), timezone);
    return { fromMs, toMs, timezone };
  }

  if (params.from || params.to) {
    const fromMs = params.from ? Date.parse(params.from) : Number.NEGATIVE_INFINITY;
    const toMs = params.to ? Date.parse(params.to) : Date.now();
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      throw new RangeError('from/to must be valid ISO 8601 timestamps');
    }
    return { fromMs, toMs, timezone };
  }

  throw new RangeError('either date or from/to is required');
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  const shifted = new Date(utcNoon + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Converts a YYYY-MM-DD local calendar date (00:00:00 local) in `timeZone`
 * to a UTC epoch millisecond, via binary search against Intl formatting
 * (avoids hand-rolled DST/offset tables).
 */
function localDateToUtcMs(isoDate: string, timeZone: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const targetUtcGuess = Date.UTC(y, m - 1, d, 0, 0, 0);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const partsToUtcMs = (ms: number): number => {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
    );
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  };

  // Offset-corrected estimate, then one refinement pass (handles DST edges).
  let candidate = targetUtcGuess;
  for (let i = 0; i < 2; i++) {
    const observedUtc = partsToUtcMs(candidate);
    const diff = targetUtcGuess - observedUtc;
    candidate += diff;
  }
  return candidate;
}

export function utcMsToIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function utcMsToLocalIso(ms: number, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const offsetRaw = (parts.timeZoneName || 'GMT+0').replace('GMT', '');
  const offset = offsetRaw === '' || offsetRaw === '+0' ? '+00:00' : normalizeOffset(offsetRaw);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

function normalizeOffset(raw: string): string {
  const match = /^([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(raw);
  if (!match) return '+00:00';
  const [, sign, h, m = '00'] = match;
  return `${sign}${h.padStart(2, '0')}:${m}`;
}
