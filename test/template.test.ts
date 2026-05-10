import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { loadTemplate, loadTemplateFromString } from '../src/index.js';

describe('template loader', () => {
  test('loads frontmatter and renders body', () => {
    const template = loadTemplateFromString('---\ndescription: Test\n---\nHello {{ name | quote }}', {
      templatePath: '/tmp/example.md',
      templateDir: '/tmp',
    });

    expect(template.frontmatter.description).toBe('Test');
    expect(template.body.trim()).toBe('Hello {{ name | quote }}');
    expect(template.render({ name: 'world' })).toBe('Hello "world"');
  });

  test('resolves partials from sibling templates directory', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'pi-template-kit-'));
    await mkdir(path.join(dir, 'templates'));
    await writeFile(path.join(dir, 'parent.md'), '{% include "child" %}', 'utf8');
    await writeFile(path.join(dir, 'templates', 'child.md'), 'inner {{ value }}', 'utf8');

    const template = await loadTemplate(path.join(dir, 'parent.md'));
    expect(template.render({ value: 'ok' })).toBe('inner ok');
  });
});
