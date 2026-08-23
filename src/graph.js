/**
 * Lite code graph — regex index of imports/exports, no Tree-sitter needed for MVP
 */
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

export async function indexDir(root = ".") {
  const graph = { nodes: [], edges: [] };
  const files = [];
  async function walk(dir) {
    let entries; try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (["node_modules",".git","dist"].includes(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if ([".js",".ts",".mjs"].includes(extname(e.name))) files.push(full);
    }
  }
  await walk(root);
  for (const f of files) {
    let content; try { content = await readFile(f, "utf8"); } catch { continue; }
    graph.nodes.push({ file: f, lines: content.split("\n").length });
    const importRe = /import\s+.*from\s+["'"'"']([^"'"'"']+)["'"'"']/g;
    let m; while ((m = importRe.exec(content)) !== null) graph.edges.push({ from: f, to: m[1], type: "import" });
  }
  return graph;
}

export function query(graph, term) {
  const lower = term.toLowerCase();
  return graph.nodes.filter(n => n.file.toLowerCase().includes(lower)).concat(
    graph.edges.filter(e => e.to.toLowerCase().includes(lower)).map(e => ({ file: `${e.from} -> ${e.to}`, lines: 0 }))
  );
}
