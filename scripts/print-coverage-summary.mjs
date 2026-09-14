#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const targets = {
  unit: {
    label: 'Unit',
    dir: join(root, 'coverage', 'unit'),
  },
  e2e: {
    label: 'E2E',
    dir: join(root, 'coverage', 'e2e'),
  },
};

const pct = (hit, total) => {
  if (total === 0) {
    return '100.0';
  }
  return ((100 * hit) / total).toFixed(1);
};

const folderKey = (filePath) => {
  const normalized = filePath.replaceAll('\\', '/');
  const parts = normalized.split('/');
  const srcIndex = parts.lastIndexOf('src');
  if (srcIndex < 0) {
    return dirname(normalized) || '.';
  }

  const fromSrc = parts.slice(srcIndex);
  if (fromSrc.length <= 2) {
    return fromSrc.slice(0, -1).join('/') || 'src';
  }

  return fromSrc.slice(0, 3).join('/');
};

const parseLcov = (lcovPath) => {
  const folders = new Map();
  let currentFile = '';
  let linesFound = 0;
  let linesHit = 0;
  let branchesFound = 0;
  let branchesHit = 0;
  let functionsFound = 0;
  let functionsHit = 0;

  const commit = () => {
    if (!currentFile) {
      return;
    }
    const key = folderKey(currentFile);
    const bucket = folders.get(key) ?? {
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
      functionsFound: 0,
      functionsHit: 0,
    };
    bucket.linesFound += linesFound;
    bucket.linesHit += linesHit;
    bucket.branchesFound += branchesFound;
    bucket.branchesHit += branchesHit;
    bucket.functionsFound += functionsFound;
    bucket.functionsHit += functionsHit;
    folders.set(key, bucket);
    currentFile = '';
    linesFound = 0;
    linesHit = 0;
    branchesFound = 0;
    branchesHit = 0;
    functionsFound = 0;
    functionsHit = 0;
  };

  for (const line of readFileSync(lcovPath, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('SF:')) {
      commit();
      currentFile = relative(root, line.slice(3)).replaceAll('\\', '/');
    } else if (line.startsWith('LF:')) {
      linesFound = Number(line.slice(3));
    } else if (line.startsWith('LH:')) {
      linesHit = Number(line.slice(3));
    } else if (line.startsWith('BRF:')) {
      branchesFound = Number(line.slice(4));
    } else if (line.startsWith('BRH:')) {
      branchesHit = Number(line.slice(4));
    } else if (line.startsWith('FNF:')) {
      functionsFound = Number(line.slice(4));
    } else if (line.startsWith('FNH:')) {
      functionsHit = Number(line.slice(4));
    } else if (line === 'end_of_record') {
      commit();
    }
  }
  commit();
  return folders;
};

const printReport = (kind) => {
  const target = targets[kind];
  if (!target) {
    throw new Error(`Unknown coverage target: ${kind}`);
  }

  mkdirSync(target.dir, { recursive: true });
  writeFileSync(join(target.dir, '.gitkeep'), '');
  const lcovPath = join(target.dir, 'lcov.info');
  const htmlPath = join(target.dir, 'index.html');

  if (!existsSync(lcovPath)) {
    console.log(`${target.label} coverage: missing ${relative(root, lcovPath)}`);
    return false;
  }

  const folders = parseLcov(lcovPath);
  const rows = [...folders.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totals = rows.reduce(
    (acc, [, bucket]) => {
      acc.linesFound += bucket.linesFound;
      acc.linesHit += bucket.linesHit;
      acc.branchesFound += bucket.branchesFound;
      acc.branchesHit += bucket.branchesHit;
      acc.functionsFound += bucket.functionsFound;
      acc.functionsHit += bucket.functionsHit;
      return acc;
    },
    {
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
      functionsFound: 0,
      functionsHit: 0,
    },
  );

  const folderWidth = Math.max(12, ...rows.map(([name]) => name.length), 5);
  const header = `${'Folder'.padEnd(folderWidth)}  Lines  Branch  Funcs`;
  console.log(`\n${target.label} coverage by folder`);
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const [name, bucket] of rows) {
    console.log(
      `${name.padEnd(folderWidth)}  ${pct(bucket.linesHit, bucket.linesFound).padStart(5)}%  ${pct(bucket.branchesHit, bucket.branchesFound).padStart(5)}%  ${pct(bucket.functionsHit, bucket.functionsFound).padStart(5)}%`,
    );
  }

  console.log('-'.repeat(header.length));
  console.log(
    `${'TOTAL'.padEnd(folderWidth)}  ${pct(totals.linesHit, totals.linesFound).padStart(5)}%  ${pct(totals.branchesHit, totals.branchesFound).padStart(5)}%  ${pct(totals.functionsHit, totals.functionsFound).padStart(5)}%`,
  );
  console.log(`Reports: ${relative(root, target.dir)}/`);
  console.log(`HTML:    ${htmlPath}`);
  return true;
};

const selected = process.argv.slice(2);
const kinds = selected.length > 0 ? selected : Object.keys(targets);
let found = false;
for (const kind of kinds) {
  found = printReport(kind) || found;
}

if (!found) {
  console.error('No coverage reports found. Run npm run test:coverage first.');
  process.exit(1);
}
