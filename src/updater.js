/**
 * Yuzz CLI — Auto Updater v1.2
 */

import fetch from 'node-fetch';
import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync, chmodSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = join(__dirname, '..');
const PKG_PATH  = join(ROOT_DIR, 'package.json');

const GITHUB_REPO  = 'yuzz-cli/yuzz';
const RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RAW_BASE     = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

const UPDATE_CACHE      = join(homedir(), '.yuzz', 'update-check.json');
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const UPDATE_FILES = [
  'package.json',
  'src/index.js',
  'src/config.js',
  'src/ui.js',
  'src/history.js',
  'src/limiter.js',
  'src/updater.js',
  'src/providers/gemini.js',
  'src/providers/openrouter.js',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getCurrentVersion() {
  try {
    return JSON.parse(readFileSync(PKG_PATH, 'utf-8')).version || '0.0.0';
  } catch { return '0.0.0'; }
}

export function semverGt(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0, nb = pb[i] ?? 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}

function shouldCheck() {
  try {
    if (!existsSync(UPDATE_CACHE)) return true;
    const cache = JSON.parse(readFileSync(UPDATE_CACHE, 'utf-8'));
    return (Date.now() - (cache.lastCheck || 0)) > CHECK_INTERVAL_MS;
  } catch { return true; }
}

function saveCheckTime(latestVersion) {
  try {
    const dir = dirname(UPDATE_CACHE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(UPDATE_CACHE, JSON.stringify({ lastCheck: Date.now(), latestVersion }));
  } catch { /* non-critical */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch latest release tag from GitHub.
 * Returns null if no release found or network fails.
 */
export async function fetchLatestVersion() {
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { 'User-Agent': 'yuzz-cli' },
      signal:  AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tag_name?.replace(/^v/, '') || null;
  } catch {
    return null;
  }
}

export async function checkForUpdate() {
  if (!shouldCheck()) return null;
  const latest  = await fetchLatestVersion();
  const current = getCurrentVersion();
  saveCheckTime(latest);
  if (latest && semverGt(latest, current)) {
    return { current, latest };
  }
  return null;
}

export function notifyUpdate(updateInfo) {
  if (!updateInfo) return;
  const { current, latest } = updateInfo;
  console.log(
    '  ' + chalk.hex('#FFD93D')('◆ Update available: ') +
    chalk.hex('#888')(`v${current}`) +
    chalk.hex('#555')(' → ') +
    chalk.hex('#44FF99').bold(`v${latest}`) +
    chalk.hex('#555')('  (type /update)\n')
  );
}

export async function runUpdate({ force = false } = {}) {
  const current = getCurrentVersion();
  const spinner = ora({ text: chalk.hex('#888')('Checking GitHub...'), spinner: 'dots', color: 'cyan' }).start();

  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    spinner.fail(chalk.hex('#FF6B6B')('Cannot reach GitHub. Check internet connection.'));
    return false;
  }

  if (!force && !semverGt(latestVersion, current)) {
    spinner.succeed(chalk.hex('#44FF99')(`Already up to date — v${current}`));
    return false;
  }

  spinner.text = chalk.hex('#888')(`Downloading v${latestVersion}...`);

  const failed = [], updated = [];

  for (const file of UPDATE_FILES) {
    const localPath  = join(ROOT_DIR, file);
    const backupPath = localPath + '.bak';
    try {
      const res = await fetch(`${RAW_BASE}/${file}`, {
        headers: { 'User-Agent': 'yuzz-cli' },
        signal:  AbortSignal.timeout(10000),
      });
      if (!res.ok) { failed.push(`${file} (HTTP ${res.status})`); continue; }

      const content = await res.text();
      if (existsSync(localPath)) { try { renameSync(localPath, backupPath); } catch { /* ok */ } }

      const dir = dirname(localPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(localPath, content, 'utf-8');
      if (file === 'src/index.js') { try { chmodSync(localPath, 0o755); } catch { /* ok */ } }

      // Clean up backup
      try { if (existsSync(backupPath)) unlinkSync(backupPath); } catch { /* ok */ }
      updated.push(file);
    } catch (err) {
      failed.push(`${file} (${err.message})`);
    }
  }

  spinner.text = chalk.hex('#888')('npm install...');
  try { execSync('npm install --silent', { cwd: ROOT_DIR, stdio: 'ignore' }); } catch { /* ok */ }

  spinner.stop();

  if (updated.length === 0) {
    console.log(chalk.hex('#FF6B6B')('\n  ✖ Update failed — GitHub may not have these files yet.\n'));
    return false;
  }

  // Bump local version
  try {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));
    pkg.version = latestVersion;
    writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  } catch { /* ok */ }

  console.log(chalk.hex('#44FF99')(`\n  ✔ Updated to v${latestVersion}`) + chalk.hex('#555')(` (${updated.length} files)\n`));
  if (failed.length > 0) {
    console.log(chalk.hex('#FFD93D')(`  ⚠ ${failed.length} file(s) skipped:`));
    failed.forEach(f => console.log(chalk.hex('#555')(`    • ${f}`)));
    console.log();
  }
  console.log(chalk.hex('#888')('  Restart yuzz to use the new version.\n'));
  return true;
}

export async function runRepair() {
  console.log(chalk.hex('#FFD93D')('\n  ◆ Repair — re-downloading all source files...\n'));
  return runUpdate({ force: true });
}
