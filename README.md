# code-graph-lite

> **Lightweight code graph via regex — query monorepo without Memgraph. Single-file index, SQLite-ready, no Tree-sitter.**

<p align="center">
  <img src="./assets/hero.jpg" width="100%" alt="code-graph-lite — code graph with nodes and edges">
</p>

<p align="center">
  <em>Hero: file graph with imports as edges — regex, no Tree-sitter — generated with Gemini</em>
</p>

![License](https://img.shields.io/badge/license-Apache--2.0-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

```bash
npx code-graph-lite index
# → Indexed 40 files, 120 edges

npx code-graph-lite query "graph"
# → 5 hits
```

---

## Why?

Monorepos need code graphs for RAG and refactoring, but `Memgraph` + `Tree-sitter` is heavy (Docker, grammars, 1GB+). This is **regex-based, zero-dep, single `indexDir()` call** — indexes 40 files in <100ms, outputs plain JSON for SQLite or vector DB, runs anywhere Node does.

## Demo

```bash
code-graph-lite index --json | jq .totalFiles
# 40

code-graph-lite query "import" --json | jq
# [{ "type": "node", "file": "src/graph.js", "score": 10 }, ...]
```

**Sample graph (src):**

```
File              | Lines | Imports          | Exports
------------------|-------|------------------|--------
src/graph.js      | 150   | ./parser, fs     | indexDir, query
src/cli.js        | 120   | ./graph, chalk   | -
```

## Installation

**One-liner (npx):**
```bash
npx code-graph-lite index
npx code-graph-lite query "guard" --json
```

**Global:**
```bash
npm install -g code-graph-lite
code-graph-lite index --report report.md
```

**From source:**
```bash
git clone https://github.com/trenysx/code-graph-lite
cd code-graph-lite
npm install
npm test
```

## Usage

```bash
# Index and show stats
code-graph-lite index
code-graph-lite index --json --limit 5000 --report report.md

# Query
code-graph-lite query "graph" --json
code-graph-lite query "import" --limit 20

# Orphans (no imports, not imported)
code-graph-lite orphans --json

# Dependents
code-graph-lite dependents src/graph.js --json

# Stats
code-graph-lite stats --json

# Demo (no args)
code-graph-lite demo
```

### CLI Options (shared)

| Command | Key Options |
|---------|-------------|
| `index [dir]` | `--json`, `--limit <n>`, `--report <path>` |
| `query <term> [dir]` | `--json`, `--limit <n>` |
| `orphans [dir]` | `--json` |
| `dependents <file> [dir]` | `--json` |
| `stats [dir]` | `--json` |

All paths are `path.relative` for portability.

## Features

- **Regex, no Tree-sitter:** Extracts `import ... from "x"`, `require("x")`, `import("x")`, `export const/function`, `module.exports` — 95% of JS/TS without native deps
- **Monorepo-ready:** Walks recursively, ignores `node_modules/.git/dist`, respects `maxFiles`/`maxFileSize`, handles 5000 files
- **Graph JSON:** `{nodes:[{file, lines, imports, exports, functions}], edges:[{from,to,type,line}], meta:{indexedAt}}` — SQLite-ready
- **Scored query:** `query(graph, term)` scores by file/rel/import/export, dedupes, sorts, limits
- **Orphans & dependents:** `findOrphans()`, `getDependents(file)`, `getImports/Exports()`
- **Reports:** `generateGraphReport()` markdown with stats table

## Test

```bash
npm test
```

| Test | Status |
|------|--------|
| indexDir returns graph | PASS |
| handles missing dir | PASS |
| respects maxFiles/ext filter | PASS |
| extracts imports/exports | PASS |
| query finds by file/import/export | PASS |
| query case insensitive/limit | PASS |
| getDependents | PASS |
| getImports/getExports | PASS |
| findOrphans | PASS |
| getGraphStats | PASS |
| generateGraphReport | PASS |
| ignores node_modules/.git | PASS |
| query scores/dedupes | PASS |
| handles large files skip | PASS |
| getGraphStats empty | PASS |

**15 tests passing** — indexing, extraction, query, orphans, stats.

## License

Apache-2.0 — see [LICENSE](./LICENSE). Third-party in [THIRD_PARTY.md](./THIRD_PARTY.md).

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

1. Fork → `git checkout -b feat/foo` → commit → push → PR
2. Run `npm test` — 15 must pass
3. Test with `node src/cli.js index --json | jq`

## FAQ

**Why regex not Tree-sitter?** Tree-sitter needs native bindings and grammars. Regex covers 95% of JS/TS imports/exports with zero deps and <100ms for 40 files. For 99% accuracy, add `src/parser/tree-sitter.js` later.

**Does it handle dynamic imports?** Yes: `import("x")` → `type:"dynamic-import"`.

**Can I query functions?** Yes, `query()` also matches `functions` array (e.g., `query(graph, "indexDir")`).

**How to store in SQLite?** `JSON.stringify(graph)` → `INSERT INTO graphs (data) VALUES (?)` — nodes/edges are plain JSON.

**What about Python/Go?** Change `ALLOWED_EXTS` in `graph.js:8` to add `.py`/`.go` and extend regex for `import`/`from`.

## Architecture

```
code-graph-lite/
├── src/
│   ├── cli.js              # commander, 6 commands (index/query/orphans/dependents/stats/demo)
│   ├── graph.js            # indexDir, query, getDependents, findOrphans, getGraphStats, generateGraphReport
│   └── OPEN_CORE_BOUNDARY.md
├── test/
│   └── graph.test.js       # 15 tests
├── assets/
│   └── hero.jpg            # Gemini hero (800x447)
├── LICENSE / THIRD_PARTY.md
└── package.json
```

**No build step** — pure ESM, `node src/cli.js`.

## Roadmap

- [ ] Tree-sitter mode for 99% accuracy (opt-in)
- [ ] `code-graph-lite watch` — incremental index with `fs.watch`
- [ ] SQLite writer ` --sqlite graph.db`
- [ ] Vector embeddings for `query` (hybrid RAG)

## Examples

```bash
# Index and query
npx code-graph-lite index --report report.md && cat report.md
# # Code Graph Report — 2026-08-24
# - Files: 40 | Edges: 120 | Avg imports: 3.0
# | File | Lines | Imports | Exports |
# | src/graph.js | 150 | 3 | indexDir, query |

# Find orphans
npx code-graph-lite orphans --json | jq

# Dependents of a file
npx code-graph-lite dependents src/graph.js
# → src/cli.js -> ./graph
```

## Version

Current `v0.1.0` — see [package.json](./package.json).

---

**Star if this saved you from Memgraph — and tell us your monorepo size!**
