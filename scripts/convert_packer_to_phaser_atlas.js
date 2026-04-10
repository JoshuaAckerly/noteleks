'use strict';

// Simple converter from packer-style JSON (frames array) to Phaser TexturePacker-style atlas JSON.
// Usage:
//   node scripts/convert_packer_to_phaser_atlas.js <inputPathOrDir> [<inputPathOrDir> ...]
// If you pass a directory it will convert all .json files in it. For each input file
// it writes a sibling file with the same basename and suffix `.phaser.json`.

import { promises as fs } from 'fs';
import path from 'path';
import child_process from 'child_process';

async function convertFile(filePath) {
  const src = await fs.readFile(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(src); // Parsing the JSON data
  } catch {
    console.error(`Skipping ${filePath}: invalid JSON`);
    return;
  }

  if (!data.frames || !Array.isArray(data.frames)) {
    // Support explicit per-frame manifest format used by our game (frameSequences)
    // which lists separate image files rather than a packed spritesheet.
    // We now support an optional selective packing workflow: if a `scripts/pack-config.json`
    // lists this manifest's directory (or the manifest file itself) we will attempt
    // to run the `texturepacker` CLI (if available) to produce a Phaser atlas. If
    // not listed (or texturepacker not present) we skip conversion and log an
    // informational message.
    if (data.frameSequences || data.sheets) {
      const packConfigPath = path.join(process.cwd(), 'scripts', 'pack-config.json');
      let packConfig = null;
      try {
        const cfgRaw = await fs.readFile(packConfigPath, 'utf8');
        packConfig = JSON.parse(cfgRaw);
      } catch {
        // no pack-config present or invalid -> treat as no packing requested
      }

      const dir = path.dirname(filePath);
      const base = path.basename(filePath);
      const shouldPack = packConfig && Array.isArray(packConfig.pack) && (
        packConfig.pack.includes(base) || packConfig.pack.includes(dir) || packConfig.pack.includes(filePath)
      );

      if (!shouldPack) {
        console.info(`Skipping ${filePath}: appears to be a per-frame manifest (frameSequences/sheets) — no packer->phaser conversion required`);
        return;
      }

      // Attempt to pack this directory using the texturepacker CLI.
      const tpAvailable = (() => {
        try {
          const v = child_process.execSync('texturepacker --version', { stdio: 'pipe' }).toString().trim();
          return v || true;
        } catch {
          return false;
        }
      })();

      const outBase = path.join(dir, base.replace(/\.json$/i, ''));
      const outJson = `${outBase}.phaser.json`;
      const outPng = `${outBase}.png`;

      if (!tpAvailable) {
        console.info(`Pack config requests packing for ${filePath} but 'texturepacker' CLI was not found.`);
        console.info(`To pack manually run (from project root):`);
        console.info(`  texturepacker --format phaser --data "${outJson}" --sheet "${outPng}" "${dir}"`);
        console.info(`Build will continue and runtime will use the per-frame manifest.`);
        return;
      }

      try {
        console.log(`Running texturepacker for ${filePath} -> ${outJson}, ${outPng}`);
        child_process.execSync(`texturepacker --format phaser --data "${outJson}" --sheet "${outPng}" "${dir}"`, { stdio: 'inherit' });
        console.log(`Packed ${filePath} -> ${path.basename(outJson)} (${filePath})`);
      } catch (err) {
        console.error(`texturepacker failed for ${filePath}: ${err.message}`);
      }

      return;
    }

    console.error(`Skipping ${filePath}: missing "frames" array`);
    return;
  }

  const meta = data.meta || {};
  const imageName = meta.image || path.basename(filePath).replace(/\.json$/i, '.png');
  const size = (meta.size && typeof meta.size === 'object') ? meta.size : { w: 0, h: 0 };

  const base = path.basename(filePath).replace(/\.json$/i, '');

  const out = {
    frames: {},
    meta: {
      app: 'packer-to-phaser',
      version: '1.0',
      image: imageName,
      format: 'RGBA8888',
      size: { w: size.w || 0, h: size.h || 0 },
      scale: '1'
    }
  };

  for (const frameEntry of data.frames) {
    // frameEntry.name may be numeric; coerce to string
    const namePart = String(frameEntry.name != null ? frameEntry.name : frameEntry.index ?? 'frame');
    const frameKey = `${base}-frame-${namePart}.png`;
    const f = frameEntry.frame || frameEntry;
    if (!f || typeof f.x !== 'number' || typeof f.y !== 'number' || typeof f.w !== 'number' || typeof f.h !== 'number') {
      console.warn(`  skipping frame ${namePart} in ${filePath}: missing x/y/w/h`);
      continue;
    }

    out.frames[frameKey] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h }
    };
  }

  const outPath = path.join(path.dirname(filePath), `${base}.phaser.json`);
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Converted ${path.basename(filePath)} -> ${path.basename(outPath)} (${Object.keys(out.frames).length} frames)`);
}

async function convertPaths(paths) {
  for (const p of paths) {
    let stat;
    try {
      stat = await fs.stat(p);
    } catch {
      console.error(`Path not found: ${p}`);
      continue;
    }

    if (stat.isDirectory()) {
      const items = await fs.readdir(p);
      for (const it of items) {
        if (/\.json$/i.test(it)) {
          await convertFile(path.join(p, it));
        }
      }
    } else if (stat.isFile()) {
      await convertFile(p);
    } else {
      console.error(`Unsupported path type: ${p}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && process.argv[1].endsWith('convert_packer_to_phaser_atlas.js')) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/convert_packer_to_phaser_atlas.js <dir-or-file> [..]');
    process.exit(2);
  }
  convertPaths(args).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
