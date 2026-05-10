import { describe, expect, test } from 'vitest';

import { createEngine, filters } from '../src/index.js';

describe('filters', () => {
  test('present matches Pi prompt conventions', () => {
    expect(filters.present(undefined)).toBe(false);
    expect(filters.present(null)).toBe(false);
    expect(filters.present('')).toBe(false);
    expect(filters.present([])).toBe(false);
    expect(filters.present('x')).toBe(true);
    expect(filters.present(['x'])).toBe(true);
  });

  test('quote escapes double quotes and trims', () => {
    expect(filters.quote('  say "hi"  ')).toBe('"say \\"hi\\""');
  });

  test('tokens estimates chars over four', () => {
    expect(filters.tokens('12345')).toBe(2);
  });

  test('json supports indentation', () => {
    expect(filters.json({ a: 1 }, 2)).toBe('{\n  "a": 1\n}');
  });

  test('shell_quote escapes single quotes', () => {
    expect(filters.shell_quote("it's ok")).toBe(`'it'"'"'s ok'`);
  });

  test('text extracts text blocks from message-like objects', () => {
    expect(filters.text({ role: 'user', content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] })).toBe('a\nb');
  });

  test('last_user_text returns newest user text across arrays', () => {
    const older = [{ role: 'user', content: 'old' }];
    const newer = [{ role: 'assistant', content: 'skip' }, { role: 'user', content: 'new' }];
    expect(filters.last_user_text(newer, older)).toBe('new');
  });
});

describe('xml tag', () => {
  test('wraps non-empty body', () => {
    const engine = createEngine();
    const out = engine.parseAndRenderSync('{% xml "focus" %}{{ focus }}{% endxml %}', { focus: 'ship it' });
    expect(out).toBe('<focus>\nship it\n</focus>\n');
  });

  test('suppresses empty body', () => {
    const engine = createEngine();
    const out = engine.parseAndRenderSync('A\n{% xml "focus" %}{{ focus }}{% endxml %}B', { focus: '' });
    expect(out).toBe('A\nB');
  });
});
