/** Đổi tên khóa camelCase ↔ snake_case (sâu, giữ nguyên mảng và giá trị nguyên thủy). */
const toSnakeKey = (k: string) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()).replace(/(\d+)/g, '_$1').replace(/__/g, '_');
const toCamelKey = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Các cột jsonb giữ nguyên khóa bên trong (không đổi tên). */
const OPAQUE_JSON = new Set(['attached', 'open_hours', 'auto_topup', 'notify_prefs', 'openHours', 'autoTopup', 'notifyPrefs']);

function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

export function toSnake<T = unknown>(v: unknown): T {
  if (Array.isArray(v)) return v.map((x) => toSnake(x)) as T;
  if (!isPlain(v)) return v as T;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === undefined) continue;
    out[toSnakeKey(k)] = OPAQUE_JSON.has(k) ? val : toSnake(val);
  }
  return out as T;
}

export function toCamel<T = unknown>(v: unknown): T {
  if (Array.isArray(v)) return v.map((x) => toCamel(x)) as T;
  if (!isPlain(v)) return v as T;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) out[toCamelKey(k)] = OPAQUE_JSON.has(k) ? val : toCamel(val);
  return out as T;
}

export const snakeKey = toSnakeKey;
