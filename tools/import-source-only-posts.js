#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const args = parseArgs(process.argv.slice(2));
const branch = args.branch || 'source';
const remote = args.remote || 'origin';
const apply = Boolean(args.apply);

const repoRoot = run('git', ['rev-parse', '--show-toplevel']);
const hexoPostsRoot = path.join(repoRoot, 'source', '_posts');
const worktreePath = path.join(
  os.tmpdir(),
  `hexo-source-import-${process.pid}-${Date.now()}`
);

let worktreeAdded = false;

try {
  prepareWorktree(repoRoot, worktreePath, branch, remote);
  worktreeAdded = true;

  const sourceFiles = listMarkdownFiles(worktreePath);
  const hexoFiles = listMarkdownFiles(hexoPostsRoot);
  const hexoSet = new Set(hexoFiles);
  const sourceOnlyFiles = sourceFiles.filter((relativePath) => !hexoSet.has(relativePath));

  printSummary(sourceOnlyFiles);

  if (!apply) {
    console.log('Dry run complete. No files were copied into source/_posts.');
    return;
  }

  let copiedCount = 0;
  sourceOnlyFiles.forEach((relativePath) => {
    const sourcePath = path.join(worktreePath, toPlatformPath(relativePath));
    const targetPath = path.join(hexoPostsRoot, toPlatformPath(relativePath));

    if (fs.existsSync(targetPath)) {
      return;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
    copiedCount += 1;
  });

  console.log(`Imported ${copiedCount} file(s) into source/_posts.`);
} finally {
  if (worktreeAdded) {
    try {
      run('git', ['worktree', 'remove', worktreePath, '--force']);
      run('git', ['worktree', 'prune']);
    } catch (error) {
      console.error(error.message);
    }
  }
}

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) {
      continue;
    }

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

function run(command, commandArgs, options) {
  const result = spawnSync(command, commandArgs, {
    cwd: options && options.cwd ? options.cwd : undefined,
    encoding: 'utf8',
    stdio: options && options.stdio ? options.stdio : 'pipe'
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Command failed: ${command} ${commandArgs.join(' ')}${detail ? `\n${detail}` : ''}`
    );
  }

  return result.stdout ? result.stdout.trim() : '';
}

function prepareWorktree(root, targetPath, targetBranch, targetRemote) {
  const localRef = `refs/heads/${targetBranch}`;
  const remoteRef = `refs/remotes/${targetRemote}/${targetBranch}`;

  if (hasRef(root, localRef)) {
    run('git', ['worktree', 'add', targetPath, targetBranch], { cwd: root });
    return;
  }

  if (hasRef(root, remoteRef)) {
    run('git', ['worktree', 'add', '-b', targetBranch, targetPath, remoteRef], { cwd: root });
    return;
  }

  throw new Error(`Branch not found: ${targetBranch}`);
}

function hasRef(root, refName) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', refName], { cwd: root });
  return result.status === 0;
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

function printSummary(relativePaths) {
  const grouped = new Map();

  relativePaths.forEach((relativePath) => {
    const topLevelDir = relativePath.split('/')[0];
    grouped.set(topLevelDir, (grouped.get(topLevelDir) || 0) + 1);
  });

  console.log(`Found ${relativePaths.length} source-only markdown file(s).`);

  Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .forEach(([dir, count]) => {
      console.log(`- ${dir}: ${count}`);
    });

  if (relativePaths.length > 0) {
    console.log('Files to import:');
    relativePaths.forEach((relativePath) => {
      console.log(relativePath);
    });
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toPlatformPath(relativePath) {
  return relativePath.split('/').join(path.sep);
}
