/**
 * Yuzz CLI — Daily Prompt Limiter
 * Tracks prompt usage per day, per provider.
 * Built-in OpenRouter key: 65 prompts/day
 * User Gemini key: no limit enforced (their own quota)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const LIMIT_DIR  = join(homedir(), '.yuzz');
const LIMIT_FILE = join(LIMIT_DIR, 'limits.json');

const DAILY_LIMITS = {
  'openrouter-builtin': 65,
  'gemini-user':        Infinity,   // user's own key, no hard cap
  'openrouter-user':    Infinity,   // user's own key
};

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function loadData() {
  try {
    if (!existsSync(LIMIT_FILE)) return {};
    return JSON.parse(readFileSync(LIMIT_FILE, 'utf-8'));
  } catch { return {}; }
}

function saveData(data) {
  try {
    if (!existsSync(LIMIT_DIR)) mkdirSync(LIMIT_DIR, { recursive: true });
    writeFileSync(LIMIT_FILE, JSON.stringify(data, null, 2));
  } catch { /* non-critical */ }
}

/**
 * Get usage for a provider today
 * @param {string} providerKey  e.g. 'openrouter-builtin'
 * @returns {{ used: number, total: number, remaining: number }}
 */
export function getUsage(providerKey) {
  if (!(providerKey in DAILY_LIMITS)) {
    return { used: 0, total: Infinity, remaining: Infinity };
  }
  const total = DAILY_LIMITS[providerKey];
  if (total === Infinity) return { used: 0, total: Infinity, remaining: Infinity };

  const data  = loadData();
  const today = todayKey();
  const used  = data?.[providerKey]?.[today] ?? 0;
  return { used, total, remaining: total - used };
}

/**
 * Check if user is within daily limit
 */
export function canSend(providerKey) {
  const { remaining } = getUsage(providerKey);
  return remaining > 0;
}

/**
 * Increment usage counter (call after successful AI response)
 */
export function incrementUsage(providerKey) {
  // Guard: unknown key or unlimited provider → skip
  if (!providerKey || !(providerKey in DAILY_LIMITS)) return;
  const total = DAILY_LIMITS[providerKey];
  if (!isFinite(total)) return; // don't track unlimited

  const data  = loadData();
  const today = todayKey();
  if (!data[providerKey]) data[providerKey] = {};
  data[providerKey][today] = (data[providerKey][today] ?? 0) + 1;

  // Prune old days (keep 7 days rolling)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  for (const pk of Object.keys(data)) {
    for (const day of Object.keys(data[pk])) {
      if (day < sevenDaysAgo) delete data[pk][day];
    }
  }

  saveData(data);
}

/**
 * Resolve which limit key applies
 */
export function getLimitKey(providerName, isBuiltin) {
  if (providerName === 'openrouter' && isBuiltin) return 'openrouter-builtin';
  if (providerName === 'openrouter') return 'openrouter-user';
  return 'gemini-user';
}

/**
 * Reset today's usage for a given provider key
 */
export function resetLimit(providerKey) {
  try {
    const data  = loadData();
    const today = todayKey();
    if (data[providerKey]) delete data[providerKey][today];
    saveData(data);
  } catch { /* non-critical */ }
}

/**
 * Wipe ALL stored limit data (fresh start)
 */
export function resetAllLimits() {
  try {
    saveData({});
  } catch { /* non-critical */ }
}

export { DAILY_LIMITS };
