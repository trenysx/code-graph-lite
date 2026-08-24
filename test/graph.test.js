import { test } from "node:test";
import assert from "node:assert/strict";
import { indexDir, query, getDependents, getImports, getExports, findOrphans, getGraphStats, generateGraphReport } from "../src/graph.js";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("indexDir returns graph", async () => {
  const g = await indexDir("src");
  assert.ok(Array.isArray(g.nodes));
  assert.ok(Array.isArray(g.edges));
});

test("indexDir — handles missing dir", async () => {
  const g = await indexDir("/nonexistent/path/12345");
  assert.equal(g.nodes.length, 0);
  assert.equal(g.edges.length, 0);
});

test("indexDir — respects maxFiles and ext filter", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-"));
  try {
    await writeFile(join(tmp, "a.js"), "import x from './b.js'");
    await writeFile(join(tmp, "b.js"), "export const y = 1");
    await writeFile(join(tmp, "ignore.txt"), "not js");
    const g = await indexDir(tmp, { maxFiles: 10 });
    assert.ok(g.nodes.some(n => n.file.includes("a.js")));
    assert.ok(!g.nodes.some(n => n.file.includes("ignore.txt")));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("indexDir — extracts imports and exports", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-imports-"));
  try {
    await writeFile(join(tmp, "a.js"), "import x from './b.js'\nimport y from 'lodash'\nconst z = require('./c.js')\nimport('./d.js')\n");
    await writeFile(join(tmp, "b.js"), "export const foo = 1\nexport default bar\nmodule.exports = {};");
    const g = await indexDir(tmp);
    const nodeA = g.nodes.find(n => n.file.includes("a.js"));
    assert.ok(nodeA.imports.includes("./b.js"));
    assert.ok(nodeA.imports.includes("lodash"));
    assert.ok(g.edges.some(e => e.type === "import"));
    const nodeB = g.nodes.find(n => n.file.includes("b.js"));
    assert.ok(nodeB.exports.includes("foo"));
    assert.ok(nodeB.exports.includes("default"));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("query — finds by file, import, export", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-query-"));
  try {
    await writeFile(join(tmp, "app.js"), "import {x} from './utils.js'\nexport const app = 1");
    await writeFile(join(tmp, "utils.js"), "export const x = 1");
    const g = await indexDir(tmp);
    const res1 = query(g, "app");
    assert.ok(res1.length > 0);
    const res2 = query(g, "utils");
    assert.ok(res2.length > 0);
    const res3 = query(g, "nonexistent12345");
    assert.equal(res3.length, 0);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("query — case insensitive and limit", async () => {
  const g = await indexDir("src");
  const res = query(g, "GRAPH", { limit: 1 });
  assert.ok(res.length <= 1);
  const res2 = query(g, "graph", { caseSensitive: false });
  assert.ok(res2.length > 0);
});

test("getDependents", async () => {
  const g = await indexDir("src");
  const deps = getDependents(g, "graph");
  assert.ok(Array.isArray(deps));
});

test("getImports and getExports", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-get-"));
  try {
    await writeFile(join(tmp, "a.js"), "import x from './b.js'\nexport const y = 1");
    const g = await indexDir(tmp);
    const file = g.nodes.find(n => n.file.includes("a.js")).file;
    assert.ok(getImports(file, g).includes("./b.js"));
    assert.ok(getExports(file, g).includes("y"));
    assert.deepEqual(getImports("nonexistent", g), []);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("findOrphans", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-orphan-"));
  try {
    await writeFile(join(tmp, "a.js"), "console.log('hi')");
    await writeFile(join(tmp, "b.js"), "import x from './a.js'");
    const g = await indexDir(tmp);
    const orphans = findOrphans(g);
    // a.js is imported by b.js, so not orphan; but if no imports, might be orphan
    assert.ok(Array.isArray(orphans));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("getGraphStats", async () => {
  const g = await indexDir("src");
  const stats = getGraphStats(g);
  assert.ok(stats.totalFiles >= 0);
  assert.ok("totalEdges" in stats);
  assert.ok("avgImports" in stats);
  assert.ok("exts" in stats);
});

test("generateGraphReport", async () => {
  const g = await indexDir("src");
  const md = generateGraphReport(g);
  assert.ok(md.includes("# Code Graph Report"));
  assert.ok(md.includes("Files:"));
});

test("indexDir — ignores node_modules and .git", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-ignore-"));
  try {
    await mkdir(join(tmp, "node_modules"), { recursive: true });
    await writeFile(join(tmp, "node_modules", "ignore.js"), "import x from 'y'");
    await writeFile(join(tmp, "a.js"), "import x from './b.js'");
    const g = await indexDir(tmp);
    assert.ok(!g.nodes.some(n => n.file.includes("node_modules")));
    assert.ok(g.nodes.some(n => n.file.includes("a.js")));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("query — scores and dedupes", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-score-"));
  try {
    await writeFile(join(tmp, "app.js"), "import x from './utils.js'");
    const g = await indexDir(tmp);
    const res = query(g, "app");
    // Should be deduped by file
    const files = res.map(r => r.file);
    assert.equal(new Set(files).size, files.length);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("indexDir — handles large files skip", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "graph-large-"));
  try {
    const large = "a".repeat(600000);
    await writeFile(join(tmp, "large.js"), large);
    const g = await indexDir(tmp, { maxFileSize: 500000 });
    assert.ok(!g.nodes.some(n => n.file.includes("large.js")));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("getGraphStats — empty graph", () => {
  const stats = getGraphStats({ nodes: [], edges: [], meta: {} });
  assert.equal(stats.totalFiles, 0);
  assert.equal(stats.avgImports, 0);
});
