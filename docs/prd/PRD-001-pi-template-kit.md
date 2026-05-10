---
title: "pi-template-kit: shared Liquid prompt-template toolkit"
prd: PRD-001
status: Draft
owner: "Victor Araújo"
issue: "N/A"
date: 2026-05-10
version: "1.0"
---

# PRD: pi-template-kit: shared Liquid prompt-template toolkit

---

## 1. Problem & Context

Two Pi packages currently duplicate LiquidJS prompt-template mechanics:

* `~/.pi/packages/grounded-compaction/extensions/grounded-compaction/template.ts` builds a file-scoped Liquid engine, parses gray-matter frontmatter, registers `text`, `last_user_text`, `tokens`, `quote`, `present`, and implements native `{% xml %}`.
* `~/workspace/victor/pi-ecosystem/pi-prompt-composer/extensions/index.ts` builds an in-memory Liquid engine, registers `present`, `quote`, `tokens`, `json`, `shell_quote`, and rewrites `{% xml %}` through a regex preprocessor before rendering.

The shared parts are library mechanics, not host orchestration. They should not live in `pi-loom`, because `pi-prompt-composer` is a public package and should not depend on a host CLI. They should not stay in `pi-prompt-core`, because that package's original "core" scope has been superseded by `pi-loom` for system prompt graph and reminder delivery.

`pi-template-kit` is the clean split: a small, provider-neutral, Pi-runtime-free package for Liquid engine setup, shared filters, native XML block rendering, and template loading.

Name check on 2026-05-10 found no local repo, GitHub repo, npm package, or scoped GitHub Packages package using `pi-template-kit` or `pi-templates`. The chosen name is `pi-template-kit` because it describes a utility kit and avoids confusion with Pi's native prompt templates.

---

## 2. Goals & Success Metrics

| Goal                             | Metric                                                                 | Target                                                        |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Single Liquid engine kit**     | Number of duplicated engine/filter/XML implementations after migration | One shared package                                            |
| **No host coupling**             | Runtime dependency on `pi-loom` or Pi SDK                              | Zero                                                          |
| **Grounded parity**              | `grounded-compaction` example snapshots after migration                | Byte-identical                                                |
| **Composer parity**              | `pi-prompt-composer` templating fixtures after migration               | Byte-identical except intentional native XML whitespace fixes |
| **Public package compatibility** | `pi-prompt-composer` can depend on package from public npm             | Yes                                                           |

**Guardrails (must not regress):**

* Do not add shell execution. Composer keeps `{% shell %}` expansion and ask/deny/allow policy.
* Do not add prompt graph, reminder registry, provider handoff, or cache-control behavior.
* Do not depend on Pi runtime packages.
* Preserve grounded-compaction `{% xml %}` empty-body suppression semantics.
* Preserve composer filters and render context compatibility.

---

## 3. Users & Use Cases

### Primary: Pi package author rendering Liquid prompts

> As a Pi package author, I want a shared Liquid engine factory and template loader so that I do not copy filters, XML tags, and frontmatter code into every extension.

**Preconditions:** Package can depend on public npm package `pi-template-kit`.

### Primary: grounded-compaction maintainer

> As grounded-compaction maintainer, I want to replace local template engine internals without changing compaction-specific render variables or examples.

**Preconditions:** `pi-template-kit` exports native XML tag and template loader matching current output.

### Primary: pi-prompt-composer maintainer

> As composer maintainer, I want to replace local Liquid engine/filter/XML code while keeping grouped prompt discovery, arg collection, and shell policy local.

**Preconditions:** `pi-template-kit` exports shared filters and native XML tag; composer can still preprocess/resolve shell blocks around rendering.

---

## 4. Scope

### In scope

1. **Liquid engine factory** — canonical defaults and optional roots/partials/layouts/extname.
2. **Shared filters** — `present`, `quote`, `tokens`, `json`, `shell_quote`, `text`, `last_user_text`.
3. **Native XML tag** — `{% xml "tag" %}...{% endxml %}` with empty-body suppression.
4. **Template loader** — file and string loaders with gray-matter frontmatter and sibling `templates/` roots.
5. **Subpath exports** — `pi-template-kit`, `pi-template-kit/liquid`, `pi-template-kit/template`.
6. **Parity tests** — unit tests for filters, XML tag, partials, and frontmatter.
7. **Consumer migration docs** — clear split for grounded-compaction and pi-prompt-composer.

### Out of scope / later

| What                      | Why                                              | Tracked in                               |
| ------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `pi-loom` prompt graph    | Host orchestration, not template library         | `pi-loom` PRD-002                        |
| System reminders          | Host/request-copy delivery, not template library | `pi-loom` PRD-003                        |
| Cache-control placement   | Provider-specific                                | `pi-loom` ADR-0003 / provider adapters   |
| Composer shell execution  | Needs operator consent and Pi `exec`             | `pi-prompt-composer`                     |
| Compaction render vars    | Workload-specific                                | `grounded-compaction`                    |
| Custom-message transforms | Separate model-visible message hygiene           | `pi-prompt-core/messages` until migrated |

### Design for future (build with awareness)

The package should stay usable outside Pi. Filters that understand Pi message shapes must be structural (`{ role, content }`) and must not import Pi types. Future packages can add domain filters locally without changing the shared kit.

---

## 5. Functional Requirements

### FR-1: Create canonical Liquid engine

`createEngine(options?)` returns a `Liquid` instance with canonical defaults and default helpers registered.

**Acceptance criteria:**

```gherkin
Given a consumer calls `createEngine()`
When they render `{{ value | quote }}` with value `ok`
Then output is `"ok"`
And `trimTagRight`, `greedy: false`, `strictVariables: false`, `strictFilters: false`, and `cache: false` are active by default
```

**Files:**

* `src/liquid/engine.ts` — engine factory.
* `src/liquid/index.ts` — subpath barrel.

### FR-2: Export shared filters

The package exports the union of current grounded-compaction and composer filters.

**Acceptance criteria:**

```gherkin
Given a consumer imports `filters`
When they call `filters.present([])`
Then the result is false
And `filters.last_user_text(messages)` returns the newest user text from structural message objects
```

**Files:**

* `src/liquid/filters.ts` — filter implementations.
* `test/liquid.test.ts` — filter coverage.

### FR-3: Provide native XML tag

The package provides the canonical native Liquid tag for XML-style prompt sections.

**Acceptance criteria:**

```gherkin
Given template `{% xml "focus" %}{{ focus }}{% endxml %}`
And focus is empty
When rendered
Then no XML block is emitted
```

**Files:**

* `src/liquid/xml-tag.ts` — tag registration.
* `test/liquid.test.ts` — XML tag coverage.

### FR-4: Load file/string templates with frontmatter

The package loads markdown templates from disk or strings, parses frontmatter, compiles the Liquid body, and resolves sibling partials/layouts.

**Acceptance criteria:**

```gherkin
Given `parent.md` includes `{% include "child" %}`
And `templates/child.md` exists beside it
When `loadTemplate(parentPath).render(vars)` runs
Then the child partial renders with the same variables
```

**Files:**

* `src/template/index.ts` — `loadTemplate`, `loadTemplateFromString`, `TemplateKitError`.
* `test/template.test.ts` — frontmatter and partial coverage.

### FR-5: Keep shell policy out

Composer-specific shell blocks must remain outside this package.

**Acceptance criteria:**

```gherkin
Given a template contains `{% shell %}`
When rendered by `pi-template-kit`
Then no command executes
And consumers that need shell behavior must implement it before/after template rendering
```

**Files:**

* `README.md` — ownership split.
* `AGENTS.md` — no-shell rule.

---

## 6. Non-Functional Requirements

| Category           | Requirement                                                 |
| ------------------ | ----------------------------------------------------------- |
| **Portability**    | No Pi runtime dependency.                                   |
| **Determinism**    | Same template and vars produce same output.                 |
| **Small surface**  | Only `liquid` and `template` subpaths in MVP.               |
| **Compatibility**  | Consumers can migrate one file at a time.                   |
| **Public package** | Package can publish to public npm for `pi-prompt-composer`. |

---

## 7. Risks & Assumptions

### Risks

| Risk                                                    | Severity | Likelihood | Mitigation                                                                              |
| ------------------------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------- |
| XML whitespace differs from composer regex preprocessor | Medium   | Medium     | Prefer native grounded semantics; document intentional fix; snapshot composer examples. |
| Library grows into host policy code                     | High     | Low        | AGENTS guardrails; no Pi runtime dependency.                                            |
| Message filters overfit Pi types                        | Medium   | Low        | Use structural message-like objects only.                                               |
| Public npm name becomes unavailable before publish      | Medium   | Low        | Name checked on 2026-05-10; create repo/package promptly.                               |

### Assumptions

* `pi-prompt-composer` should remain able to publish publicly.
* `grounded-compaction` can depend on a public npm package even though local package is currently under `~/.pi/packages`.
* Native `{% xml %}` semantics are preferred over composer's regex source rewrite.

---

## 8. Design Decisions

### D1: New package vs. keeping pi-prompt-core

**Options considered:**

1. Keep Liquid/template in `pi-prompt-core`.
2. Export Liquid/template from `pi-loom`.
3. Create `pi-template-kit`.

**Decision:** Create `pi-template-kit`.

**Rationale:** `pi-prompt-core` name and scope are now wrong; `pi-loom` is a host CLI and would couple public composer to host internals. A small public template kit is the clean reusable unit.

### D2: Native XML tag vs. composer regex preprocessor

**Options considered:**

1. Native Liquid tag from grounded-compaction.
2. Regex rewrite from composer.

**Decision:** Native Liquid tag.

**Rationale:** Native tag uses Liquid parser state, handles nested Liquid correctly, and avoids source rewriting. Composer can keep shell preprocessing separately.

---

## 9. File Breakdown

| File                    | Change type | FR        | Description                              |
| ----------------------- | ----------- | --------- | ---------------------------------------- |
| `package.json`          | New         | FR-1–FR-5 | Public npm package metadata and exports. |
| `src/liquid/engine.ts`  | New         | FR-1      | Engine factory.                          |
| `src/liquid/filters.ts` | New         | FR-2      | Shared filters.                          |
| `src/liquid/xml-tag.ts` | New         | FR-3      | Native XML tag.                          |
| `src/liquid/index.ts`   | New         | FR-1–FR-3 | Liquid subpath exports.                  |
| `src/template/index.ts` | New         | FR-4      | Template loader.                         |
| `src/index.ts`          | New         | FR-1–FR-4 | Root exports.                            |
| `test/liquid.test.ts`   | New         | FR-1–FR-3 | Filter/XML tests.                        |
| `test/template.test.ts` | New         | FR-4      | Loader tests.                            |
| `README.md`             | New         | FR-5      | Package purpose and split.               |
| `AGENTS.md`             | New         | FR-5      | Agent guidance and boundaries.           |

---

## 10. Dependencies & Constraints

* `liquidjs` latest checked 2026-05-10: `10.25.7`.
* `gray-matter` latest checked 2026-05-10: `4.0.3`.
* `typescript` latest checked 2026-05-10: `6.0.3`.
* `vitest` latest checked 2026-05-10: `4.1.5`.
* No Pi runtime dependencies.

---

## 11. Rollout Plan

1. Seed `pi-template-kit` with engine, filters, XML tag, loader, and tests.
2. Update `pi-loom` docs to reference `pi-template-kit` for template mechanics.
3. Mark `pi-prompt-core` PRD-001 template/system-prompt scope superseded.
4. Migrate `grounded-compaction` template engine and run examples.
5. Migrate `pi-prompt-composer` Liquid engine and run templating fixtures.
6. Publish public npm package once both consumers pass parity checks.

---

## 12. Open Questions

| #  | Question                                                                    | Owner  | Due                                       | Status |
| -- | --------------------------------------------------------------------------- | ------ | ----------------------------------------- | ------ |
| Q1 | Should `pi-prompt-core/messages` move to a separate `pi-message-kit` later? | Victor | Before deprecating pi-prompt-core package | Open   |
| Q2 | Should composer accept native XML whitespace drift if snapshots differ?     | Victor | Composer migration                        | Open   |

---

## 13. Related

| Issue                                 | Relationship                                            |
| ------------------------------------- | ------------------------------------------------------- |
| `pi-loom` PRD-002                     | Uses Liquid serializer but does not own template kit.   |
| `grounded-compaction` template engine | Migration source and parity target.                     |
| `pi-prompt-composer` Liquid engine    | Migration source and parity target.                     |
| `pi-prompt-core` PRD-001              | Superseded for Liquid/template and system-prompt scope. |

---

## 14. Changelog

| Date       | Change        | Author        |
| ---------- | ------------- | ------------- |
| 2026-05-10 | Initial draft | Victor Araújo |

---

## 15. Verification (Appendix)

1. Run `pnpm run check` in `pi-template-kit`.
2. After grounded migration, run `pnpm test` in `~/.pi/packages/grounded-compaction`.
3. After composer migration, run `mise run hooks:test` in `pi-prompt-composer`.
