# pi-template-kit

Shared LiquidJS prompt-template toolkit for Pi packages.

## Purpose

This repo owns reusable template mechanics only:

- LiquidJS engine factory with canonical defaults
- shared filters: `present`, `quote`, `tokens`, `json`, `shell_quote`, `text`, `last_user_text`
- native `{% xml "tag" %}...{% endxml %}` tag
- file/string template loading with gray-matter frontmatter and sibling `templates/` roots

It does not own:

- `pi-loom` prompt graph or system-reminder delivery
- provider payload shaping or cache-control placement
- `pi-prompt-composer` grouped prompt discovery, argument collection, or `{% shell %}` execution policy
- `grounded-compaction` render-variable builders or compaction workflow
- `pi-prompt-core/messages` custom-message registry

## Grounding

Before behavior changes, read:

1. [`docs/prd/PRD-001-pi-template-kit.md`](docs/prd/PRD-001-pi-template-kit.md)
2. [`README.md`](README.md)
3. Current consumers:
   - `~/workspace/victor/pi-ecosystem/pi-prompt-composer/extensions/index.ts`
   - `~/.pi/packages/grounded-compaction/extensions/grounded-compaction/template.ts`

## Development

Use pnpm.

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
```

For behavior changes, run `pnpm run check` before commit.

## Style

- TypeScript strict.
- Public APIs use stable subpaths: `pi-template-kit/liquid`, `pi-template-kit/template`.
- Keep runtime dependencies small. No Pi runtime dependency in this package.
- Do not add shell execution here. Composer owns shell policy.
- Do not add prompt graph or reminder concepts here. `pi-loom` owns those.

## Git

Use Conventional Commits. No AI attribution trailers or generated-by footers.
