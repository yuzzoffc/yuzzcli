import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_PATH  = join(__dirname, '..', 'package.json');

export function getVersion() {
  try {
    return JSON.parse(readFileSync(PKG_PATH, 'utf-8')).version || '1.2.1';
  } catch { return '1.2.1'; }
}

// ─── Gradients ────────────────────────────────────────────────────────────────
const yuzzGrad   = gradient(['#B57BFF', '#7ED4FF', '#00D9FF']);
const titleGrad  = gradient(['#FF6FD8', '#B57BFF', '#00D9FF']);
const warmGrad   = gradient(['#FFD93D', '#FF6B6B']);

// ─── ASCII Logo ───────────────────────────────────────────────────────────────
const LOGO_LINES = [
  '  ██╗   ██╗██╗   ██╗███████╗███████╗',
  '  ╚██╗ ██╔╝██║   ██║╚══███╔╝╚══███╔╝',
  '   ╚████╔╝ ██║   ██║  ███╔╝   ███╔╝ ',
  '    ╚██╔╝  ██║   ██║ ███╔╝   ███╔╝  ',
  '     ██║   ╚██████╔╝███████╗███████╗',
  '     ╚═╝    ╚═════╝ ╚══════╝╚══════╝',
];

// ─── Welcome Screen ───────────────────────────────────────────────────────────
export function renderWelcome(providerName, modelName, limitInfo = null) {
  // Full terminal clear
  process.stdout.write('\x1Bc');

  const ver = getVersion();

  // Logo with gradient
  console.log('\n' + yuzzGrad(LOGO_LINES.join('\n')));
  console.log(
    '  ' + chalk.hex('#555')('─'.repeat(36)) + '\n'
  );

  // Info bar
  const providerLabel = providerName === 'OpenRouter (Built-in)'
    ? chalk.hex('#00D9FF').bold('OpenRouter') + chalk.hex('#44FF99')(' ✦ Built-in')
    : chalk.hex('#00D9FF').bold(providerName);

  const infoLine =
    chalk.hex('#666')('  ') +
    chalk.hex('#888')('ver ') + chalk.hex('#B57BFF').bold(ver) +
    chalk.hex('#555')('  │  ') +
    providerLabel +
    chalk.hex('#555')('  │  ') +
    chalk.hex('#7ED4FF')(modelName);

  console.log(infoLine);

  // Daily limit bar (if applicable)
  if (limitInfo) {
    const { used, total } = limitInfo;
    const remaining = total - used;
    const pct = Math.round((used / total) * 100);
    const barLen = 20;
    const filled  = Math.round((used / total) * barLen);
    const empty   = barLen - filled;

    let barColor = '#44FF99';
    if (pct >= 75) barColor = '#FFD93D';
    if (pct >= 90) barColor = '#FF6B6B';

    const bar =
      chalk.hex('#333')('[') +
      chalk.hex(barColor)('█'.repeat(filled)) +
      chalk.hex('#333')('░'.repeat(empty)) +
      chalk.hex('#333')(']');

    console.log(
      '\n  ' + chalk.hex('#666')('Daily limit  ') +
      bar +
      chalk.hex('#888')(` ${used}/${total} prompts`) +
      (remaining <= 5 ? chalk.hex('#FF6B6B').bold(`  ⚠ ${remaining} left!`) : '')
    );
  }

  // Divider + hint
  console.log(
    '\n  ' + chalk.hex('#333')('─'.repeat(36)) +
    '\n  ' +
    chalk.hex('#555')('Type ') + chalk.hex('#00D9FF')('/help') +
    chalk.hex('#555')(' for all commands  ·  ') +
    chalk.hex('#555')('Ctrl+C') + chalk.hex('#555')(' or ') +
    chalk.hex('#555')('/exit') + chalk.hex('#555')(' to quit') +
    '\n'
  );
}

// ─── Help Panel ───────────────────────────────────────────────────────────────
export function renderHelp() {
  const title = titleGrad('\n  ╔══ YUZZ CLI — COMMANDS ══╗\n');

  const sec = (label) =>
    '\n  ' + chalk.hex('#B57BFF').bold(label) + '\n  ' + chalk.hex('#333')('─'.repeat(44));

  const cmd = (c, d, extra = '') =>
    `\n  ${chalk.hex('#00D9FF').bold(c.padEnd(18))}  ${chalk.hex('#CCCCCC')(d)}` +
    (extra ? chalk.hex('#555')(`  ${extra}`) : '');

  const output =
    title +
    sec('💬  Chat Commands') +
    cmd('/help',     'Show this help panel') +
    cmd('/clear',    'Clear screen + reset chat') +
    cmd('/history',  'Show recent messages') +
    cmd('/models',   'List available AI models') +
    cmd('/code',     'Toggle code-generator mode', '[on/off]') +
    cmd('/system',   'View / set system prompt') +
    cmd('/limit',    'Show daily prompt usage') +
    cmd('/resetlimit','Reset today\'s prompt counter', '[if stuck at limit]') +
    cmd('/cekversion','Check current & latest version') +
    cmd('/update',   'Update Yuzz to latest version') +
    cmd('/repair',   'Re-download all source files') +
    cmd('/exit',     'Exit Yuzz') +

    sec('⚙️   CLI Commands (outside chat)') +
    cmd('yuzz',           'Start Yuzz (default: OpenRouter)') +
    cmd('yuzz gemini',    'Start with Google Gemini') +
    cmd('yuzz model',     'Pick a specific model') +
    cmd('yuzz setkey',    'Save your Gemini API key') +
    cmd('yuzz config',    'Show current config') +
    cmd('yuzz reset',     'Clear saved history') +
    cmd('yuzz resetlimit','Reset daily prompt counter') +
    cmd('yuzz update',    'Update to latest version') +
    cmd('yuzz repair',    'Force re-download all files') +
    cmd('yuzz --version', 'Show version') +

    sec('🔑  API Keys') +
    '\n  ' + chalk.hex('#888')('OpenRouter   ') + chalk.hex('#44FF99')('Built-in key (no setup needed!)') +
    '\n  ' + chalk.hex('#888')('Gemini       ') + chalk.cyan.underline('https://aistudio.google.com/app/apikey') +
    '\n';

  console.log(
    boxen(output, {
      padding:     { top: 0, bottom: 1, left: 1, right: 1 },
      margin:      { left: 1 },
      borderStyle: 'round',
      borderColor: '#B57BFF',
    })
  );
}

// ─── Error Box ────────────────────────────────────────────────────────────────
export function renderError(msg, hint = '') {
  const content =
    chalk.hex('#FF6B6B').bold('  ✖  Error\n\n') +
    chalk.hex('#FFAAAA')('  ' + msg) +
    (hint ? '\n\n  ' + chalk.hex('#888')(hint) : '');

  console.log(
    '\n' + boxen(content, {
      padding:     1,
      margin:      { left: 2 },
      borderStyle: 'round',
      borderColor: '#FF6B6B',
    }) + '\n'
  );
}

// ─── Warning Box ──────────────────────────────────────────────────────────────
export function renderWarning(msg) {
  console.log(
    '\n' + boxen(
      chalk.hex('#FFD93D').bold('  ⚠  Warning\n\n') +
      chalk.hex('#FFEEAA')('  ' + msg),
      {
        padding:     1,
        margin:      { left: 2 },
        borderStyle: 'round',
        borderColor: '#FFD93D',
      }
    ) + '\n'
  );
}

// ─── Limit Reached Box ───────────────────────────────────────────────────────
export function renderLimitReached(used, total, provider) {
  const reset = new Date();
  reset.setUTCHours(24, 0, 0, 0);
  const minsLeft = Math.round((reset - Date.now()) / 60000);
  const hh = Math.floor(minsLeft / 60);
  const mm = minsLeft % 60;

  console.log(
    '\n' + boxen(
      warmGrad('  ★  Daily Limit Reached\n') +
      '\n' +
      chalk.hex('#FFEEAA')(`  You've used all ${total} daily prompts for ${provider}.\n`) +
      chalk.hex('#888')(`  Resets in `) + chalk.white.bold(`${hh}h ${mm}m`) + chalk.hex('#888')(' (midnight UTC)\n\n') +
      chalk.hex('#555')('  Tip: ') + chalk.hex('#00D9FF')('yuzz gemini') + chalk.hex('#555')('  — use Gemini with your own key\n') +
      chalk.hex('#555')('       ') + chalk.hex('#7ED4FF')('yuzz setkey') + chalk.hex('#555')('  — add a Gemini API key'),
      {
        padding:     1,
        margin:      { left: 2 },
        borderStyle: 'round',
        borderColor: '#FFD93D',
      }
    ) + '\n'
  );
}

// ─── System / Info line ───────────────────────────────────────────────────────
export function renderSystem(msg) {
  console.log('\n  ' + chalk.hex('#44FF99')('◆  ') + chalk.hex('#AAFFCC')(msg) + '\n');
}

// ─── Info line ────────────────────────────────────────────────────────────────
export function renderInfo(msg) {
  console.log('  ' + chalk.hex('#7ED4FF')('ℹ  ') + chalk.hex('#CCDDFF')(msg));
}

// ─── Code mode banner ─────────────────────────────────────────────────────────
export function renderCodeMode(on) {
  const label = on
    ? chalk.hex('#00D9FF').bold('  </> Code Generator Mode: ') + chalk.hex('#44FF99').bold('ON')
    : chalk.hex('#888').bold('  </> Code Generator Mode: ') + chalk.hex('#FF6B6B').bold('OFF');
  console.log('\n' + label + '\n');
}

// ─── AI Response header ───────────────────────────────────────────────────────
export function renderResponseHeader(modelName, promptsLeft, total) {
  const limitStr = promptsLeft !== null
    ? chalk.hex('#555')('  [') +
      (promptsLeft <= 5 ? chalk.hex('#FF6B6B') : chalk.hex('#888'))(`${total - promptsLeft}/${total}`) +
      chalk.hex('#555')(']')
    : '';

  console.log(
    '\n  ' + chalk.hex('#B57BFF').bold('◆ Yuzz') +
    chalk.hex('#555')(` ─ ${modelName}`) +
    limitStr
  );
  console.log('  ' + chalk.hex('#2A2A3A')('─'.repeat(52)));
}

// ─── Version check result ─────────────────────────────────────────────────────
export function renderVersionCheck(current, latest) {
  let latestDisplay;
  if (!latest) {
    latestDisplay = chalk.hex('#888')('There is no latest version');
  } else if (latest === current) {
    latestDisplay = chalk.hex('#44FF99').bold(`v${latest}`) + chalk.hex('#888')(' (up to date)');
  } else {
    latestDisplay = chalk.hex('#FFD93D').bold(`v${latest}`) + chalk.hex('#888')(' (update available → /update)');
  }

  console.log(
    '\n' + boxen(
      yuzzGrad('  Version Check\n') + '\n' +
      chalk.hex('#888')('  Current  ') + chalk.hex('#00D9FF').bold(`v${current}`) + '\n' +
      chalk.hex('#888')('  Latest   ') + latestDisplay,
      {
        padding:     1,
        margin:      { left: 2 },
        borderStyle: 'round',
        borderColor: '#444',
      }
    ) + '\n'
  );
}
