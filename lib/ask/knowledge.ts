import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// What the /ask assistant "knows": the project docs plus every source file.
// Only these folders and file types are read, so .env files and other
// secrets can never end up in the prompt.
const DOCS = ["SYLLABUS.md", "README.md", "PRODUCT.md", "docs/demo-script.md", "docs/l2-session-log.md", "package.json", "next.config.ts", "proxy.ts"];
const DIRS = ["app", "components", "hooks", "lib", "supabase/migrations"];
const TEST_DIRS = ["tests", "e2e"]; // listed by name only, to keep the prompt under ~100k tokens
const CODE = /\.(ts|tsx|css|sql)$/;
const SKIP = /database\.types\.ts$/; // generated, very long, nothing to explain

// The files are listed for deployment in next.config.ts (outputFileTracingIncludes),
// so tell the bundler not to trace these runtime reads (it would pull in the whole repo).
const at = (root: string, file: string) => path.join(/* turbopackIgnore: true */ root, file);

/** Code files under the given folders. */
function codeFiles(root: string, dirs: string[]): string[] {
  return dirs
    .filter((d) => existsSync(at(root, d)))
    .flatMap((dir) => readdirSync(at(root, dir), { recursive: true }).map((f) => path.join(dir, String(f))))
    .filter((f) => CODE.test(f) && !SKIP.test(f));
}

/** Every file the assistant reads in full, sorted so the prompt is identical each time (needed for caching). */
export function knowledgeFiles(root = process.cwd()): string[] {
  return [...DOCS.filter((f) => existsSync(at(root, f))), ...codeFiles(root, DIRS)].sort();
}

let cached: string | null = null;

/** All files as one text block, read from disk once per server start. */
export function projectKnowledge(root = process.cwd()): string {
  if (cached) return cached;
  const files = knowledgeFiles(root).map((f) => `<file path="${f}">\n${readFileSync(at(root, f), "utf8")}\n</file>`);
  const tests = `<test-files>\n${codeFiles(root, TEST_DIRS).sort().join("\n")}\n</test-files>`;
  cached = [...files, tests].join("\n\n");
  return cached;
}
