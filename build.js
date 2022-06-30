const { execSync } = require("child_process");
const { build: esbuild } = require("esbuild");
const { promises: { readFile, writeFile } } = require("fs");

const copy = async (file, out) => {
  const data = await readFile(file);
  return Promise.all(out.map(async outFile => writeFile(outFile, data)));
}

const configs = [{
  entryPoints: ["src/index.ts"],
  outfile: "dist/esm/index.mjs",
  format: "esm"
}, {
  entryPoints: ["src/index.ts"],
  outfile: "dist/cjs/index.cjs",
  format: "cjs"
}]

Promise.all(configs.map(esbuild))
  .then(() => execSync("tsc"))
  .then(() => copy(
    "dist/index.d.ts", ["dist/esm/index.d.ts", "dist/cjs/index.d.ts"]
  ));