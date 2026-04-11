#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);

const repoRoot = run('git', ['rev-parse', '--show-toplevel']);
const postsRoot = path.join(repoRoot, 'source', '_posts');
const sourceWorktree = path.join(os.tmpdir(), `source-fm-fix-${process.pid}-${Date.now()}`);

let worktreeAdded = false;

try {
  ensureSourceWorktree();

  const addedDateByPath = buildAddedDateMap();
  const sourceHashToDate = buildSourceHashDateMap(sourceWorktree, addedDateByPath);
  const files = listMarkdownFiles(postsRoot);

  let fixedCount = 0;

  files.forEach((relativePath) => {
    const absolutePath = path.join(postsRoot, toPlatformPath(relativePath));
    const content = fs.readFileSync(absolutePath, 'utf8');

    if (hasFrontMatter(content)) {
      return;
    }

    const title = inferTitle(relativePath, content);
    const date = inferDate(relativePath, content, addedDateByPath, sourceHashToDate);
    const categories = inferCategories(relativePath);
    const frontMatter = [
      '---',
      `title: ${escapeYamlScalar(title)}`,
      `date: ${date}`,
      'tags:',
      'categories:',
      ...categories.map((item) => `- ${escapeYamlScalar(item)}`),
      '---',
      ''
    ].join('\n');

    fixedCount += 1;

    if (apply) {
      fs.writeFileSync(absolutePath, `${frontMatter}${content}`, 'utf8');
    }
  });

  console.log(`Detected ${fixedCount} post(s) without front matter.`);
  console.log(apply ? 'Applied front matter fixes.' : 'Dry run complete. No files changed.');
} finally {
  if (worktreeAdded) {
    spawnSync('git', ['worktree', 'remove', sourceWorktree, '--force'], { cwd: repoRoot });
    spawnSync('git', ['worktree', 'prune'], { cwd: repoRoot });
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) continue;

    const key = value.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    i += 1;
  }
  return parsed;
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe'
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Command failed: ${command} ${commandArgs.join(' ')}${detail ? `\n${detail}` : ''}`
    );
  }

  return result.stdout ? result.stdout.trim() : '';
}

function ensureSourceWorktree() {
  run('git', ['worktree', 'add', sourceWorktree, 'source'], { cwd: repoRoot });
  worktreeAdded = true;
}

function buildAddedDateMap() {
  const output = execFileSync(
    'git',
    ['log', 'refs/heads/source', '--diff-filter=A', '--name-only', '-z', '--format=%x00%aI'],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  const addedDateByPath = new Map();
  let currentDate = null;

  output.split('\u0000').forEach((part) => {
    if (!part) {
      return;
    }

    const value = part.trim();
    if (!value) {
      return;
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      currentDate = value;
      return;
    }

    if (!currentDate || addedDateByPath.has(value)) {
      return;
    }

    addedDateByPath.set(value, currentDate);
  });

  return addedDateByPath;
}

function buildSourceHashDateMap(sourceRoot, addedDateByPath) {
  const files = listMarkdownFiles(sourceRoot);
  const hashDateMap = new Map();

  files.forEach((relativePath) => {
    const absolutePath = path.join(sourceRoot, toPlatformPath(relativePath));
    const hash = hashFile(absolutePath);
    const date = addedDateByPath.get(relativePath);
    if (hash && date && !hashDateMap.has(hash)) {
      hashDateMap.set(hash, date);
    }
  });

  return hashDateMap;
}

function listMarkdownFiles(baseDir) {
  const files = [];
  walk(baseDir, baseDir, files);
  return files.sort((left, right) => left.localeCompare(right));
}

function walk(baseDir, currentDir, files) {
  fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === '.git' || entry.name === '.sync') {
      return;
    }

    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walk(baseDir, absolutePath, files);
      return;
    }

    if (!entry.name.endsWith('.md') || entry.name === 'Readme.md') {
      return;
    }

    files.push(path.relative(baseDir, absolutePath).split(path.sep).join('/'));
  });
}

function hasFrontMatter(content) {
  return /^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/.test(content);
}

function inferTitle(relativePath, content) {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) {
    return heading[1].trim();
  }

  return path.basename(relativePath, '.md');
}

function inferDate(relativePath, content, addedDateByPath, sourceHashToDate) {
  const exactMatch = addedDateByPath.get(relativePath);
  if (exactMatch) {
    return toHexoDate(exactMatch);
  }

  const hashMatch = sourceHashToDate.get(hashContent(content));
  if (hashMatch) {
    return toHexoDate(hashMatch);
  }

  return '2021-05-20 23:13:23';
}

function inferCategories(relativePath) {
  const segments = relativePath.split('/');
  segments.pop();
  return segments.length ? segments : ['uncategorized'];
}

function toHexoDate(isoDateTime) {
  const normalized = isoDateTime.replace('T', ' ');
  return normalized.slice(0, 19);
}

function hashFile(filePath) {
  return hashContent(fs.readFileSync(filePath, 'utf8'));
}

function hashContent(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

function escapeYamlScalar(value) {
  if (/[:#\[\]\{\},&*!?|>'"%@`]/.test(value) || /^\s|\s$/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function toPlatformPath(relativePath) {
  return relativePath.split('/').join(path.sep);
}
