#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const args = parseArgs(process.argv.slice(2));
const branch = args.branch || 'source';
const remote = args.remote || 'origin';
const dryRun = Boolean(args['dry-run']);
const push = Boolean(args.push);

const repoRoot = run('git', ['rev-parse', '--show-toplevel']);
const postsRoot = path.join(repoRoot, 'source', '_posts');

if (!fs.existsSync(postsRoot)) {
  fail(`Posts directory not found: ${postsRoot}`);
}

const worktreePath = path.join(
  os.tmpdir(),
  `hexo-source-sync-${process.pid}-${Date.now()}`
);

let worktreeAdded = false;

try {
  prepareWorktree(repoRoot, worktreePath, branch, remote);
  worktreeAdded = true;

  const previousManifest = readManifest(worktreePath);
  const currentFiles = listFiles(postsRoot);
  const currentRelativePaths = currentFiles.map((file) => file.relativePath);
  const previousPaths = new Set(previousManifest.files || []);
  const currentPathSet = new Set(currentRelativePaths);

  let copiedCount = 0;
  let removedCount = 0;

  currentFiles.forEach((file) => {
    const targetPath = path.join(worktreePath, toPlatformPath(file.relativePath));
    if (!filesEqual(file.absolutePath, targetPath)) {
      copiedCount += 1;
      if (!dryRun) {
        ensureDir(path.dirname(targetPath));
        fs.copyFileSync(file.absolutePath, targetPath);
      }
    }
  });

  Array.from(previousPaths)
    .filter((relativePath) => !currentPathSet.has(relativePath))
    .forEach((relativePath) => {
      const targetPath = path.join(worktreePath, toPlatformPath(relativePath));
      if (fs.existsSync(targetPath)) {
        removedCount += 1;
        if (!dryRun) {
          fs.unlinkSync(targetPath);
          pruneEmptyDirs(path.dirname(targetPath), worktreePath);
        }
      }
    });

  const nextManifest = {
    managedBy: 'scripts/sync-source-branch.js',
    sourceRoot: 'source/_posts',
    files: currentRelativePaths
  };

  const manifestChanged =
    JSON.stringify(previousManifest) !== JSON.stringify(nextManifest);

  if (manifestChanged && !dryRun) {
    const manifestPath = getManifestPath(worktreePath);
    ensureDir(path.dirname(manifestPath));
    fs.writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
  }

  const changed = copiedCount > 0 || removedCount > 0 || manifestChanged;

  console.log(`Scanned ${currentFiles.length} post file(s).`);
  console.log(`Will copy ${copiedCount} file(s) and remove ${removedCount} file(s).`);

  if (dryRun) {
    console.log('Dry run complete. No branch changes were written.');
    return;
  }

  if (!changed) {
    console.log(`No changes detected for branch "${branch}".`);
    return;
  }

  run('git', ['-C', worktreePath, 'add', '-A']);

  const message = buildCommitMessage(repoRoot);
  run('git', ['-C', worktreePath, 'commit', '-m', message], { stdio: 'pipe' });
  console.log(`Committed sync changes to "${branch}".`);

  if (push) {
    run('git', ['-C', worktreePath, 'push', remote, `HEAD:${branch}`], { stdio: 'inherit' });
    console.log(`Pushed changes to ${remote}/${branch}.`);
  }
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
    fail(`Command failed: ${command} ${commandArgs.join(' ')}${detail ? `\n${detail}` : ''}`);
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

  run('git', ['worktree', 'add', '--detach', targetPath], { cwd: root });
  run('git', ['-C', targetPath, 'checkout', '--orphan', targetBranch]);
  clearDirectory(targetPath);
}

function hasRef(root, refName) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', refName], {
    cwd: root
  });
  return result.status === 0;
}

function listFiles(baseDir) {
  const files = [];
  walk(baseDir, baseDir, files);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function walk(baseDir, currentDir, files) {
  fs.readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walk(baseDir, absolutePath, files);
      return;
    }

    const relativePath = path.relative(baseDir, absolutePath).split(path.sep).join('/');
    files.push({ absolutePath, relativePath });
  });
}

function getManifestPath(root) {
  return path.join(root, '.sync', 'source-branch-manifest.json');
}

function readManifest(root) {
  const manifestPath = getManifestPath(root);
  if (!fs.existsSync(manifestPath)) {
    return { managedBy: 'scripts/sync-source-branch.js', sourceRoot: 'source/_posts', files: [] };
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function filesEqual(sourcePath, targetPath) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  const sourceBuffer = fs.readFileSync(sourcePath);
  const targetBuffer = fs.readFileSync(targetPath);
  if (sourceBuffer.length !== targetBuffer.length) {
    return false;
  }

  return crypto.createHash('sha1').update(sourceBuffer).digest('hex') ===
    crypto.createHash('sha1').update(targetBuffer).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function pruneEmptyDirs(startDir, stopDir) {
  let currentDir = startDir;
  while (currentDir.startsWith(stopDir) && currentDir !== stopDir) {
    if (fs.readdirSync(currentDir).length > 0) {
      return;
    }
    fs.rmdirSync(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

function clearDirectory(dirPath) {
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === '.git') {
      return;
    }

    const targetPath = path.join(dirPath, entry.name);
    removePath(targetPath);
  });
}

function removePath(targetPath) {
  const stats = fs.lstatSync(targetPath);
  if (stats.isDirectory()) {
    fs.readdirSync(targetPath).forEach((name) => {
      removePath(path.join(targetPath, name));
    });
    fs.rmdirSync(targetPath);
    return;
  }

  fs.unlinkSync(targetPath);
}

function toPlatformPath(relativePath) {
  return relativePath.split('/').join(path.sep);
}

function buildCommitMessage(root) {
  const shortSha = run('git', ['rev-parse', '--short', 'HEAD'], { cwd: root });
  return `chore: sync posts from hexo (${shortSha})`;
}

function fail(message) {
  throw new Error(message);
}
