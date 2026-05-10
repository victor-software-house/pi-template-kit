import { Liquid, type LiquidOptions } from 'liquidjs';

import { registerDefaultFilters } from './filters.js';
import { registerXmlTag } from './xml-tag.js';

export interface CreateEngineOptions extends LiquidOptions {
  registerDefaults?: boolean;
  registerXml?: boolean;
}

export function createEngine(options: CreateEngineOptions = {}): Liquid {
  const { registerDefaults = true, registerXml = true, ...liquidOptions } = options;
  const engine = new Liquid({
    cache: false,
    strictVariables: false,
    strictFilters: false,
    trimTagRight: true,
    greedy: false,
    ...liquidOptions,
  });

  if (registerDefaults) {
    registerDefaultFilters((name, filter) => engine.registerFilter(name, filter));
  }
  if (registerXml) {
    registerXmlTag(engine);
  }

  return engine;
}
