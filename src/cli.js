#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { indexDir, query } from "./graph.js";

const program = new Command();
program.name("code-graph-lite").description("Lite code graph").version("0.1.0");

program.command("index")
  .argument("[dir]", "dir", ".")
  .option("--json", "json", false)
  .action(async (dir, opts) => {
    const g = await indexDir(dir);
    if (opts.json) { console.log(JSON.stringify(g, null, 2)); return; }
    console.log(chalk.bold.cyan(`Indexed ${g.nodes.length} files, ${g.edges.length} edges`));
    const t = new Table({ head: [chalk.cyan("File"), chalk.cyan("Lines")], colWidths: [50, 10], style: { head: [], border: [] } });
    for (const n of g.nodes.slice(0, 10)) t.push([n.file, String(n.lines)]);
    console.log(t.toString());
  });

program.command("query")
  .argument("<term>", "search term")
  .argument("[dir]", "dir", ".")
  .action(async (term, dir) => {
    const g = await indexDir(dir);
    const res = query(g, term);
    console.log(chalk.bold(`Query "${term}" -> ${res.length} hits`));
    for (const r of res.slice(0, 10)) console.log(` - ${r.file}`);
  });

if (process.argv.length === 2) program.parse(["node","cli.js","index"]);
else program.parse();
