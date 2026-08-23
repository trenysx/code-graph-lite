import { test } from "node:test";
import assert from "node:assert/strict";
import { indexDir } from "../src/graph.js";

test("indexDir returns graph", async () => {
  const g = await indexDir("src");
  assert.ok(Array.isArray(g.nodes));
  assert.ok(Array.isArray(g.edges));
});
