/**
 * graph.js — lite code graph via regex, no Tree-sitter
 * Indexes JS/TS files, extracts imports/exports, builds graph for monorepo queries.
 * SQLite-ready: nodes/edges are plain JSON.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, relative, resolve } from "node:path";
import { existsSync } from "node:fs";

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", ".next", "coverage", ".turbo", "vendor", "__pycache__", ".venv", "out", "build"]);
const ALLOWED_EXTS = new Set([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".mts", ".cts"]);
const MAX_FILE_SIZE = 500_000; // 500KB
const MAX_FILES = 5000;

export async function indexDir(root = ".", opts = {}) {
  const { maxFiles = MAX_FILES, maxFileSize = MAX_FILE_SIZE, includeExts = null } = opts;
  const graph = { nodes: [], edges: [], meta: { root: resolve(root), indexedAt: new Date().toISOString(), totalFiles: 0 } };
  const files = [];

  async function walk(dir) {
    if (files.length >= maxFiles) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORE_DIRS.has(e.name)) continue;
      if (e.name.startsWith(".") && e.name !== ".env") continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile()) {
        const ext = extname(e.name);
        const allowed = includeExts ? includeExts.has(ext) : ALLOWED_EXTS.has(ext);
        if (!allowed) continue;
        try {
          const s = await stat(full);
          if (s.size > maxFileSize) continue;
        } catch { continue; }
        files.push(full);
        if (files.length >= maxFiles) break;
      }
    }
  }

  await walk(root);
  graph.meta.totalFiles = files.length;

  for (const f of files) {
    let content;
    try { content = await readFile(f, "utf8"); } catch { continue; }
    const lines = content.split("\n").length;
    const rel = relative(root, f);
    const node = {
      file: f,
      rel,
      lines,
      ext: extname(f),
      size: content.length,
      imports: [],
      exports: [],
      functions: [],
    };
    // imports: import ... from "x", import "x", require("x")
    const importRe = /import\s+(?:.*?\s+from\s+)?["'"'"']([^"'"'"']+)["'"'"']/g;
    const requireRe = /require\s*\(\s*["'"'"']([^"'"'"']+)["'"'"']\s*\)/g;
    const dynamicImportRe = /import\s*\(\s*["'"'"']([^"'"'"']+)["'"'"']\s*\)/g;
    let m;
    while ((m = importRe.exec(content)) !== null) {
      node.imports.push(m[1]);
      graph.edges.push({ from: f, to: m[1], type: "import", line: content.slice(0, m.index).split("\n").length });
    }
    while ((m = requireRe.exec(content)) !== null) {
      node.imports.push(m[1]);
      graph.edges.push({ from: f, to: m[1], type: "require", line: content.slice(0, m.index).split("\n").length });
    }
    while ((m = dynamicImportRe.exec(content)) !== null) {
      node.imports.push(m[1]);
      graph.edges.push({ from: f, to: m[1], type: "dynamic-import", line: content.slice(0, m.index).split("\n").length });
    }
    // exports: export const, export function, export default, module.exports
    const exportRe = /export\s+(?:default\s+)?(?:const|let|var|function|class|async function)\s+(\w+)/g;
    while ((m = exportRe.exec(content)) !== null) {
      node.exports.push(m[1]);
    }
    if (/export\s+default/.test(content)) node.exports.push("default");
    if (/module\.exports/.test(content)) node.exports.push("module.exports");
    // functions: function foo, const foo = () =>, const foo = function
    const funcRe = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>|const\s+(\w+)\s*=\s*function)/g;
    while ((m = funcRe.exec(content)) !== null) {
      const name = m[1] || m[2] || m[3];
      if (name) node.functions.push(name);
    }
    graph.nodes.push(node);
  }

  return graph;
}

export function query(graph, term, opts = {}) {
  const { caseSensitive = false, limit = 20 } = opts;
  const q = caseSensitive ? term : term.toLowerCase();
  const match = (s) => caseSensitive ? s.includes(term) : s.toLowerCase().includes(q);
  const results = [];
  for (const n of graph.nodes) {
    if (match(n.file) || match(n.rel) || n.imports.some(i => match(i)) || n.exports.some(e => match(e)) || n.functions.some(f => match(f))) {
      results.push({ type: "node", file: n.file, rel: n.rel, lines: n.lines, imports: n.imports, exports: n.exports, score: scoreNode(n, term) });
    }
  }
  for (const e of graph.edges) {
    if (match(e.to) || match(e.from)) {
      results.push({ type: "edge", file: `${e.from} -> ${e.to}`, from: e.from, to: e.to, edgeType: e.type, score: 1 });
    }
  }
  // dedupe and sort by score
  const seen = new Set();
  const deduped = results.filter(r => {
    const key = r.file;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => b.score - a.score);
  return deduped.slice(0, limit);
}

function scoreNode(node, term) {
  const lowerTerm = term.toLowerCase();
  let score = 0;
  if (node.file.toLowerCase().includes(lowerTerm)) score += 10;
  if (node.rel.toLowerCase().includes(lowerTerm)) score += 5;
  if (node.imports.some(i => i.toLowerCase().includes(lowerTerm))) score += 3;
  if (node.exports.some(e => e.toLowerCase().includes(lowerTerm))) score += 3;
  if (node.functions.some(f => f.toLowerCase().includes(lowerTerm))) score += 2;
  return score;
}

export function getDependents(graph, file) {
  return graph.edges.filter(e => e.to.includes(file) || e.from.includes(file)).map(e => ({ file: e.from, to: e.to, type: e.type }));
}

export function getImports(file, graph) {
  const node = graph.nodes.find(n => n.file === file || n.rel === file);
  return node ? node.imports : [];
}

export function getExports(file, graph) {
  const node = graph.nodes.find(n => n.file === file || n.rel === file);
  return node ? node.exports : [];
}

export function findOrphans(graph) {
  const imported = new Set(graph.edges.map(e => e.to));
  return graph.nodes.filter(n => !imported.has(n.file) && !imported.has(n.rel) && n.imports.length === 0);
}

export function getGraphStats(graph) {
  const totalFiles = graph.nodes.length;
  const totalEdges = graph.edges.length;
  const avgImports = totalFiles ? (totalEdges / totalFiles).toFixed(1) : 0;
  const exts = {};
  for (const n of graph.nodes) exts[n.ext] = (exts[n.ext] || 0) + 1;
  return { totalFiles, totalEdges, avgImports, exts, indexedAt: graph.meta?.indexedAt };
}

export function generateGraphReport(graph) {
  const stats = getGraphStats(graph);
  const lines = [];
  lines.push(`# Code Graph Report — ${new Date().toISOString().slice(0, 10)}`);
  lines.push(``);
  lines.push(`- Files: ${stats.totalFiles} | Edges: ${stats.totalEdges} | Avg imports: ${stats.avgImports}`);
  lines.push(`- Exts: ${Object.entries(stats.exts).map(([k, v]) => `${k}:${v}`).join(", ")}`);
  lines.push(``);
  lines.push(`| File | Lines | Imports | Exports |`);
  lines.push(`|------|-------|---------|---------|`);
  for (const n of graph.nodes.slice(0, 20)) {
    lines.push(`| ${n.rel} | ${n.lines} | ${n.imports.length} | ${n.exports.slice(0, 2).join(",") || "-"} |`);
  }
  return lines.join("\n");
}
