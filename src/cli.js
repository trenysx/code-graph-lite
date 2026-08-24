#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { writeFile } from "node:fs/promises";
import { indexDir, query, getGraphStats, findOrphans, generateGraphReport, getDependents } from "./graph.js";

const program = new Command();
program.name("code-graph-lite").description("Lite code graph via regex — query monorepo without Memgraph. SQLite-ready.").version("0.1.0");

program.command("index")
  .description("Index a directory and show stats")
  .argument("[dir]", "directory to index", ".")
  .option("--json", "json output", false)
  .option("--limit <n>", "max files", "5000")
  .option("--report <path>", "write markdown report", null)
  .action(async (dir, opts) => {
    const limit = parseInt(opts.limit, 10) || 5000;
    const g = await indexDir(dir, { maxFiles: limit });
    const stats = getGraphStats(g);
    if (opts.json) { console.log(JSON.stringify({ ...stats, nodes: g.nodes.slice(0, 5) }, null, 2)); return; }
    console.log(chalk.bold.cyan(`\n⎈ Code Graph — ${dir}`));
    console.log(chalk.dim(`Indexed ${stats.totalFiles} files, ${stats.totalEdges} edges, avg ${stats.avgImports} imports/file`));
    console.log(chalk.dim(`Exts: ${Object.entries(stats.exts).map(([k, v]) => `${k}:${v}`).join(", ")}`));
    const t = new Table({ head: [chalk.cyan("File"), chalk.cyan("Lines"), chalk.cyan("Imports"), chalk.cyan("Exports")], colWidths: [40, 10, 30, 20], style: { head: [], border: [] } });
    for (const n of g.nodes.slice(0, 10)) t.push([n.rel.slice(0, 40), String(n.lines), n.imports.slice(0, 2).join(", ") || "-", n.exports.slice(0, 2).join(",") || "-"]);
    console.log(t.toString());
    if (opts.report) {
      const md = generateGraphReport(g);
      await writeFile(opts.report, md, "utf8");
      console.log(chalk.dim(`Report written to ${opts.report}`));
    }
  });

program.command("query")
  .description("Query the graph for a term")
  .argument("<term>", "search term (file, import, export, function)")
  .argument("[dir]", "directory to index", ".")
  .option("--json", "json output", false)
  .option("--limit <n>", "limit results", "20")
  .action(async (term, dir, opts) => {
    const limit = parseInt(opts.limit, 10) || 20;
    const g = await indexDir(dir);
    const res = query(g, term, { limit });
    if (opts.json) { console.log(JSON.stringify({ term, total: res.length, results: res }, null, 2)); return; }
    console.log(chalk.bold(`Query "${term}" → ${res.length} hits (from ${g.nodes.length} files)`));
    if (!res.length) { console.log(chalk.yellow("No hits — try a different term")); return; }
    const t = new Table({ head: [chalk.cyan("Type"), chalk.cyan("File"), chalk.cyan("Score")], colWidths: [10, 60, 10], style: { head: [], border: [] } });
    for (const r of res.slice(0, 10)) t.push([r.type, r.file.slice(0, 60), String(r.score || "-")]);
    console.log(t.toString());
  });

program.command("orphans")
  .description("Find orphan files (no imports, not imported)")
  .argument("[dir]", "directory", ".")
  .option("--json", "json output", false)
  .action(async (dir, opts) => {
    const g = await indexDir(dir);
    const orphans = findOrphans(g);
    if (opts.json) { console.log(JSON.stringify(orphans, null, 2)); return; }
    console.log(chalk.bold.cyan(`\n⎈ Orphans — ${orphans.length} files`));
    for (const o of orphans.slice(0, 10)) console.log(` - ${o.rel} (${o.lines} lines)`);
  });

program.command("dependents")
  .description("Find dependents of a file")
  .argument("<file>", "file to find dependents for")
  .argument("[dir]", "directory", ".")
  .option("--json", "json output", false)
  .action(async (file, dir, opts) => {
    const g = await indexDir(dir);
    const deps = getDependents(g, file);
    if (opts.json) { console.log(JSON.stringify(deps, null, 2)); return; }
    console.log(chalk.bold(`Dependents of "${file}" → ${deps.length} hits`));
    for (const d of deps.slice(0, 10)) console.log(` - ${d.file} -> ${d.to} (${d.type})`);
  });

program.command("stats")
  .description("Show graph stats")
  .argument("[dir]", "directory", ".")
  .option("--json", "json output", false)
  .action(async (dir, opts) => {
    const g = await indexDir(dir);
    const stats = getGraphStats(g);
    if (opts.json) { console.log(JSON.stringify(stats, null, 2)); return; }
    console.log(chalk.bold.cyan(`\n⎈ Stats — ${dir}`));
    console.log(`Files: ${stats.totalFiles} | Edges: ${stats.totalEdges} | Avg imports: ${stats.avgImports}`);
    console.log(`Exts: ${JSON.stringify(stats.exts)}`);
  });

program.command("demo")
  .description("Demo with mock data")
  .action(async () => {
    const g = await indexDir("src");
    console.log(chalk.bold("Demo: index src"));
    console.log(`Found ${g.nodes.length} files, ${g.edges.length} edges`);
    const res = query(g, "graph");
    console.log(`Query "graph" → ${res.length} hits`);
    console.log(res.slice(0, 3));
  });

if (process.argv.length === 2) program.parse(["node", "cli.js", "index"]);
else program.parse();
