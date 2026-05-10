export interface MessageLike {
  role?: unknown;
  content?: unknown;
}

export function present(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

export function quote(value: unknown): string {
  if (value === null || value === undefined) return '';
  return `"${stringifyScalar(value).replace(/"/g, '\\"').trim()}"`;
}

export function tokens(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Math.ceil(stringifyScalar(value).length / 4);
}

export function json(value: unknown, spaces?: unknown): string {
  const indentation = typeof spaces === 'number' && Number.isInteger(spaces) && spaces >= 0 ? Math.min(spaces, 8) : 0;
  return JSON.stringify(value, null, indentation) ?? 'null';
}

export function shellQuote(value: unknown): string {
  const raw = stringifyScalar(value);
  if (raw === '') return "''";
  return `'${raw.replace(/'/g, `'"'"'`)}'`;
}

export function text(value: unknown): string {
  return extractMessageText(value);
}

export function lastUserText(primary: unknown, ...rest: unknown[]): string {
  for (const group of [primary, ...rest]) {
    if (!Array.isArray(group)) continue;
    for (let index = group.length - 1; index >= 0; index--) {
      const message = group[index];
      if (isMessageLike(message) && message.role === 'user') {
        const extracted = extractMessageText(message);
        if (extracted) return extracted;
      }
    }
  }
  return '';
}

export const filters = {
  present,
  quote,
  tokens,
  json,
  shell_quote: shellQuote,
  text,
  last_user_text: lastUserText,
} as const;

export function registerDefaultFilters(register: (name: string, filter: (...args: unknown[]) => unknown) => void): void {
  register('present', present);
  register('quote', quote);
  register('tokens', tokens);
  register('json', json);
  register('shell_quote', shellQuote);
  register('text', text);
  register('last_user_text', lastUserText);
}

function stringifyScalar(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function isMessageLike(value: unknown): value is MessageLike {
  return typeof value === 'object' && value !== null && 'role' in value;
}

function extractMessageText(value: unknown): string {
  if (!isMessageLike(value)) return '';
  const { content } = value;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const parts: string[] = [];
  for (const block of content) {
    if (
      block &&
      typeof block === 'object' &&
      (block as { type?: unknown }).type === 'text' &&
      typeof (block as { text?: unknown }).text === 'string'
    ) {
      parts.push((block as { text: string }).text);
    }
  }
  return parts.join('\n');
}
