# pi-template-kit

Shared LiquidJS prompt-template toolkit for Pi packages.

## Why

`grounded-compaction` and `pi-prompt-composer` both grew local Liquid engines:

- same engine defaults
- overlapping filters
- incompatible `{% xml %}` implementations
- duplicated frontmatter/template loading logic

`pi-template-kit` is the small library that owns that shared layer. It does **not** own `pi-loom` host orchestration, system prompt graph policy, reminders, provider payloads, or custom-message registries.

## Package surfaces

| Import | Purpose |
|---|---|
| `pi-template-kit/liquid` | `createEngine`, filters, native `{% xml %}` tag |
| `pi-template-kit/template` | `loadTemplate`, `loadTemplateFromString`, frontmatter + partial/layout roots |
| `pi-template-kit` | re-exports both surfaces |

## Example

```ts
import { loadTemplate } from 'pi-template-kit/template';

const template = await loadTemplate('compaction-prompt.md');
const out = template.render({ focus: 'ship it' });
```

## Ownership split

| Package | Owns |
|---|---|
| `pi-template-kit` | Liquid engine, shared filters, `{% xml %}` tag, file template loader |
| `pi-loom` | prompt graph, system reminders, host coordinator, provider handoff metadata |
| `pi-prompt-composer` | grouped prompt discovery, arg collection, shell block policy |
| `grounded-compaction` | compaction render variables, summary workflow, examples |
| `pi-prompt-core` | legacy `messages` registry until consumers migrate; no new template/system-prompt work |

## Development

```bash
pnpm install
pnpm run check
```

## License

MIT
