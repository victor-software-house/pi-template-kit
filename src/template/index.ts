import { readFile } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';
import type { Template } from 'liquidjs';

import { createEngine, type CreateEngineOptions } from '../liquid/index.js';

export interface LoadedTemplate<Frontmatter extends Record<string, unknown> = Record<string, unknown>> {
  templatePath: string;
  templateDir: string;
  frontmatter: Frontmatter;
  body: string;
  render(vars?: Record<string, unknown>): string;
}

export interface LoadTemplateOptions<Frontmatter extends Record<string, unknown> = Record<string, unknown>> {
  templatePath?: string;
  templateDir?: string;
  engine?: CreateEngineOptions;
  parseFrontmatter?: (raw: Record<string, unknown>) => Frontmatter;
}

export class TemplateKitError extends Error {
  readonly templatePath: string;

  constructor(message: string, templatePath: string) {
    super(message);
    this.name = 'TemplateKitError';
    this.templatePath = templatePath;
  }
}

export async function loadTemplate<Frontmatter extends Record<string, unknown> = Record<string, unknown>>(
  templatePath: string,
  options: Omit<LoadTemplateOptions<Frontmatter>, 'templatePath' | 'templateDir'> = {},
): Promise<LoadedTemplate<Frontmatter>> {
  const raw = await readFile(templatePath, 'utf8');
  return loadTemplateFromString(raw, {
    ...options,
    templatePath,
    templateDir: path.dirname(templatePath),
  });
}

export function loadTemplateFromString<Frontmatter extends Record<string, unknown> = Record<string, unknown>>(
  raw: string,
  options: LoadTemplateOptions<Frontmatter>,
): LoadedTemplate<Frontmatter> {
  const templatePath = options.templatePath ?? '<template-string>';
  const templateDir = options.templateDir ?? process.cwd();
  const parsed = matter(raw);
  const body = parsed.content;
  const frontmatter = options.parseFrontmatter
    ? options.parseFrontmatter(parsed.data)
    : (parsed.data as Frontmatter);

  const engine = createEngine({
    root: [path.join(templateDir, 'templates'), templateDir],
    partials: [path.join(templateDir, 'templates'), templateDir],
    layouts: [path.join(templateDir, 'templates'), templateDir],
    extname: '.md',
    ...options.engine,
  });

  let template: Template[];
  try {
    template = engine.parse(body, templatePath);
  } catch (error) {
    throw new TemplateKitError(`Failed to parse template ${templatePath}: ${stringifyError(error)}`, templatePath);
  }

  return {
    templatePath,
    templateDir,
    frontmatter,
    body,
    render(vars: Record<string, unknown> = {}): string {
      try {
        return String(engine.renderSync(template, vars));
      } catch (error) {
        throw new TemplateKitError(`Failed to render template ${templatePath}: ${stringifyError(error)}`, templatePath);
      }
    },
  };
}

function stringifyError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
