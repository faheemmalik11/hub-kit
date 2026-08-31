// tsc compiles with moduleResolution "bundler", so relative imports keep no file extension.
// That is fine for a bundler consumer but Node's own ESM loader (e.g. TanStack Start's SSR
// runtime) requires an explicit extension on every relative specifier. This rewrites the
// compiled dist/*.js output only, adding ".js" or "/index.js" as the file system dictates.
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { globSync } from "node:fs";

const distDir = new URL("../dist", import.meta.url).pathname;
const files = globSync(join(distDir, "**/*.js"));

const specifierPattern = /((?:from|import)\s+["'])(\.[^"']+)(["'])/g;

function resolveExtension(fromFile, specifier) {
  const base = join(dirname(fromFile), specifier);
  if (existsSync(base + ".js")) return specifier + ".js";
  if (existsSync(base) && statSync(base).isDirectory() && existsSync(join(base, "index.js"))) {
    return specifier + "/index.js";
  }
  return specifier; // already has an extension, or points somewhere unexpected — leave as is
}

function fixFile(file) {
  const original = readFileSync(file, "utf8");
  const updated = original.replace(specifierPattern, (match, pre, specifier, post) => {
    if (/\.[a-zA-Z]+$/.test(specifier)) return match; // already has an extension
    return pre + resolveExtension(file, specifier) + post;
  });
  if (updated !== original) writeFileSync(file, updated);
}

for (const file of files) fixFile(file);
console.log(`Fixed ESM extensions in ${files.length} compiled files.`);
