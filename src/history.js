import { config } from './config.js';
import { createRequire } from 'module';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HISTORY_DIR = join(homedir(), '.yuzz');
const HISTORY_FILE = join(HISTORY_DIR, 'history.json');

export function loadHistory() {
  if (!config.get('save_history')) return [];
  try {
    if (!existsSync(HISTORY_FILE)) return [];
    const raw = readFileSync(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(raw);
    const maxHistory = config.get('max_history') || 50;
    // Only return last N turns (each turn = 2 messages)
    return history.slice(-(maxHistory * 2));
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  if (!config.get('save_history')) return;
  try {
    if (!existsSync(HISTORY_DIR)) {
      mkdirSync(HISTORY_DIR, { recursive: true });
    }
    const maxHistory = config.get('max_history') || 50;
    const trimmed = history.slice(-(maxHistory * 2));
    writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch {
    // Silent fail — history saving is non-critical
  }
}

export { history };

function history() {
  return loadHistory();
}
