import * as esbuild from "esbuild";
import { copyFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "src");
const root = __dirname;

const isWatch = process.argv.includes("--watch");

const common = {
  bundle: true,
  sourcemap: false,
  minify: !isWatch,
  tsconfig: resolve(__dirname, "tsconfig.json"),
};

async function build() {
  // Build service worker (ESM)
  await esbuild.build({
    ...common,
    entryPoints: [resolve(src, "background/service-worker.ts")],
    outfile: resolve(root, "background.js"),
    format: "esm",
    platform: "browser",
    target: "es2022",
  });

  // Build popup (IIFE)
  await esbuild.build({
    ...common,
    entryPoints: [resolve(src, "popup/popup.ts")],
    outfile: resolve(root, "popup/popup.js"),
    format: "iife",
    platform: "browser",
    target: "es2022",
  });

  // Copy static assets to output directories
  const popupOut = resolve(root, "popup");
  mkdirSync(popupOut, { recursive: true });
  copyFileSync(resolve(src, "popup/popup.html"), resolve(popupOut, "popup.html"));
  copyFileSync(resolve(src, "popup/styles.css"), resolve(popupOut, "styles.css"));

  // Generate icon PNGs
  for (const size of [16, 48, 128]) {
    const iconPath = resolve(root, `assets/icon-${size}.png`);
    if (!existsSync(iconPath)) {
      generateIcon(size, iconPath);
    }
  }

  console.log("✅ Build complete");
}

function generateIcon(size, outPath) {
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, "ascii");
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRow = Buffer.alloc(1 + size * 3);
  rawRow[0] = 0;
  for (let x = 0; x < size; x++) {
    rawRow[1 + x * 3] = 0x3b;
    rawRow[2 + x * 3] = 0x82;
    rawRow[3 + x * 3] = 0xf6;
  }
  const raw = Buffer.concat(Array(size).fill(rawRow));

  const zlib = require("zlib");
  const compressed = zlib.deflateSync(raw);
  const idat = pngChunk("IDAT", compressed);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    idat,
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  writeFileSync(outPath, png);
}

if (isWatch) {
  (async () => {
    const ctx = await esbuild.context({
      ...common,
      entryPoints: [resolve(src, "background/service-worker.ts")],
      outfile: resolve(root, "background.js"),
      format: "esm",
      platform: "browser",
      target: "es2022",
    });
    await ctx.watch();
    console.log("👀 Watching...");
  })();
} else {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
