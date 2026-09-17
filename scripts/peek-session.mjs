// Usage: node scripts/peek-session.mjs <path-to-session.v3.jsonl.zstd>
// Prints provider/model/reasoningEffort mentions from the first lines of a
// zstd-compressed DSH session log (acceptance tooling for model routing).
import z from "node:zlib";
import fs from "node:fs";

const p = process.argv[2];
const out = z.zstdDecompressSync(fs.readFileSync(p)).toString("utf8");
const lines = out.split("\n").filter(Boolean);
for (const l of lines.slice(0, 8)) {
  const m = l.match(/"(provider|model|reasoningEffort)"\s*:\s*"[^"]*"/g);
  if (m) console.log(m.join("  "));
}
if (process.argv[3] === "raw") {
  for (const l of lines.slice(0, 3)) console.log(l.slice(0, 1500) + "\n---");
}
if (process.argv[3] === "types") {
  console.log("lines: " + lines.length);
  for (const l of lines) {
    const t = l.match(/"type"\s*:\s*"[^"]*"/);
    console.log((t ? t[0] : "?") + "  len=" + l.length);
  }
}
if (process.argv[3] === "grep" && process.argv[4]) {
  const needle = process.argv[4];
  for (const l of lines) if (l.includes(needle)) console.log(l.slice(0, 800) + "\n---");
}
