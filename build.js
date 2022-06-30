const { execSync } = require("child_process");
const { build: esbuild } = require("esbuild");

const configs = [{
  entryPoints: ["src/index.ts"],
  outfile: "dist/esm/index.mjs",
  format: "esm"
}, {
  entryPoints: ["src/index.ts"],
  outfile: "dist/cjs/index.cjs",
  format: "cjs"
}]

Promise.all(configs.map(esbuild)).then(() => execSync("tsc"));