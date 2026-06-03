#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import ora from 'ora';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

import { config }                                           from './config.js';
import { GeminiProvider }                                   from './providers/gemini.js';
import { OpenRouterProvider }                               from './providers/openrouter.js';
import { saveHistory, loadHistory }                         from './history.js';
import { getUsage, canSend, incrementUsage, getLimitKey, resetAllLimits, resetLimit } from './limiter.js';
import {
  checkForUpdate, notifyUpdate, runUpdate, runRepair,
  fetchLatestVersion, getCurrentVersion,
}                                                           from './updater.js';
import {
  renderWelcome, renderHelp, renderError, renderWarning,
  renderSystem, renderInfo, renderCodeMode,
  renderResponseHeader, renderVersionCheck, renderLimitReached,
  getVersion,
}                                                           from './ui.js';

// ─── Marked terminal renderer ─────────────────────────────────────────────────
marked.use(markedTerminal({
  code:         chalk.hex('#00D9FF'),
  codespan:     chalk.hex('#00D9FF').bold,
  heading:      chalk.hex('#B57BFF').bold,
  firstHeading: chalk.hex('#B57BFF').bold,
  strong:       chalk.white.bold,
  em:           chalk.italic,
  blockquote:   chalk.hex('#666666').italic,
  listitem:     chalk.hex('#CCCCCC'),
}));

// ─── Code-generator system prompt ─────────────────────────────────────────────
const CODE_SYSTEM = `You are Yuzz Code, an expert coding assistant running in a terminal.
When writing code:
- Always use fenced code blocks with the language tag (e.g. \`\`\`python)
- Explain what each block does briefly above it
- Prefer complete, runnable examples
- Mention any required dependencies
- Keep responses focused and practical`;

// ─── CLI ARGS ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

// Simplified command grammar:
//   yuzz                     → start (default provider)
//   yuzz gemini              → start with Gemini
//   yuzz model <alias>       → start OR set model
//   yuzz setkey gemini <KEY> → save Gemini key
//   yuzz setkey or <KEY>     → save OpenRouter key
//   yuzz config              → show config
//   yuzz reset               → clear history
//   yuzz update              → update
//   yuzz repair              → repair
//   yuzz --version / -v      → version
//   yuzz --help / -h         → help (outside chat)

const cmd0 = args[0] || '';
const cmd1 = args[1] || '';
const cmd2 = args[2] || '';

// ── Simple one-off commands ───────────────────────────────────────────────────

if (cmd0 === '--version' || cmd0 === '-v') {
  console.log(`Yuzz CLI v${getVersion()}`);
  process.exit(0);
}

if (cmd0 === '--help' || cmd0 === '-h') {
  renderHelp();
  process.exit(0);
}

if (cmd0 === 'config') {
  const cfg = config.getAll();
  const lines = Object.entries(cfg).map(([k, v]) => {
    const val = k.includes('key')
      ? (v ? chalk.hex('#44FF99')('✓ Set') : chalk.hex('#FF6B6B')('✗ Not set'))
      : chalk.hex('#7ED4FF')(String(v));
    return `  ${chalk.hex('#888')(k.padEnd(22))} ${val}`;
  }).join('\n');
  console.log('\n' + chalk.hex('#B57BFF').bold('  ⚙  Config\n') + lines + '\n');
  process.exit(0);
}

if (cmd0 === 'reset') {
  saveHistory([]);
  renderSystem('Chat history cleared!  (To also reset daily limit: yuzz resetlimit)');
  process.exit(0);
}

if (cmd0 === 'resetlimit') {
  resetAllLimits();
  renderSystem('Daily prompt limit counter reset to 0!');
  process.exit(0);
}

if (cmd0 === 'update') {
  await runUpdate();
  process.exit(0);
}

if (cmd0 === 'repair') {
  await runRepair();
  process.exit(0);
}

// yuzz setkey gemini <KEY>  or  yuzz setkey or <KEY>
if (cmd0 === 'setkey') {
  const provider = cmd1;
  const key      = cmd2;
  if (!provider || !key) {
    renderError('Usage: yuzz setkey gemini <API_KEY>');
    process.exit(1);
  }
  const k = provider === 'or' ? 'openrouter' : provider;
  config.set(`${k}_key`, key);
  renderSystem(`✓ ${k} API key saved!`);
  process.exit(0);
}

// ─── Resolve provider + model for chat ───────────────────────────────────────
function buildProvider() {
  // yuzz gemini [model <alias>]
  if (cmd0 === 'gemini') {
    const key = config.get('gemini_key');
    if (!key) {
      renderError(
        'Gemini API key not set.',
        'Run: yuzz setkey gemini YOUR_KEY\nGet free key: https://aistudio.google.com/app/apikey'
      );
      process.exit(1);
    }
    let modelAlias = config.get('model_gemini') || null;
    // yuzz gemini model flash
    if (cmd1 === 'model' && cmd2) {
      modelAlias = cmd2;
      config.set('model_gemini', cmd2);
    }
    return new GeminiProvider(key, modelAlias);
  }

  // yuzz model <alias>  → sets model on current provider, then starts
  if (cmd0 === 'model' && cmd1) {
    const provName = config.get('provider') || 'openrouter';
    if (provName === 'gemini') {
      config.set('model_gemini', cmd1);
    } else {
      config.set('model_openrouter', cmd1);
    }
    // fall through to normal start
  }

  // Default: OpenRouter (built-in key if user has none)
  const userKey    = config.get('openrouter_key') || null;
  const modelAlias = config.get('model_openrouter') || null;
  return new OpenRouterProvider(userKey, modelAlias);
}

// ─── MAIN CHAT ────────────────────────────────────────────────────────────────
async function main() {
  const provider = buildProvider();

  // Determine limit key
  const limitKey = getLimitKey(
    provider.name.toLowerCase().includes('openrouter') ? 'openrouter' : 'gemini',
    provider.isBuiltin === true
  );
  const hasLimit = limitKey === 'openrouter-builtin';

  // Initial usage info
  const usage = getUsage(limitKey);

  // Clear terminal & show welcome
  renderWelcome(
    provider.name,
    provider.model,
    hasLimit ? { used: usage.used, total: usage.total } : null
  );

  // Silent update check
  try {
    const upd = await checkForUpdate();
    notifyUpdate(upd);
  } catch { /* non-critical */ }

  const chatHistory = loadHistory();
  let codeMode      = config.get('code_mode') || false;

  // ── Readline ──────────────────────────────────────────────────────────────
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  const gracefulExit = () => {
    saveHistory(chatHistory);
    console.log('\n' + chalk.hex('#555')('  Goodbye! 👋\n'));
    process.exit(0);
  };
  rl.on('close', gracefulExit);
  process.on('SIGINT',  () => rl.close());
  process.on('SIGTERM', () => rl.close());

  // ── Prompt ────────────────────────────────────────────────────────────────
  const askPrompt = () => {
    const codePfx = codeMode ? chalk.hex('#00D9FF')('</> ') : '';
    rl.question(chalk.hex('#444')(' ❯ ') + codePfx, async (raw) => {
      const input = raw.trim();
      if (!input) return askPrompt();

      // ── Commands ──────────────────────────────────────────────────────────
      if (input === '/exit' || input === '/quit') return rl.close();

      if (input === '/clear') {
        chatHistory.length = 0;
        const newUsage = getUsage(limitKey);
        renderWelcome(provider.name, provider.model,
          hasLimit ? { used: newUsage.used, total: newUsage.total } : null);
        return askPrompt();
      }

      if (input === '/help') { renderHelp(); return askPrompt(); }

      if (input === '/models') { provider.listModels(); return askPrompt(); }

      if (input === '/history') {
        if (chatHistory.length === 0) {
          renderInfo('No history yet.');
        } else {
          chatHistory.forEach((m, i) => {
            const lbl = m.role === 'user'
              ? chalk.hex('#00D9FF')('You')
              : chalk.hex('#B57BFF')('Yuzz');
            const preview = m.content.length > 90 ? m.content.slice(0, 90) + '…' : m.content;
            console.log(`  ${chalk.hex('#333')((i+1).toString().padStart(2,'0'))} ${lbl} ${chalk.hex('#444')(preview)}`);
          });
          console.log();
        }
        return askPrompt();
      }

      // /code  or  /code on  /code off
      if (input === '/code' || input.startsWith('/code ')) {
        const arg = input.split(' ')[1];
        if (arg === 'on')       codeMode = true;
        else if (arg === 'off') codeMode = false;
        else                    codeMode = !codeMode;
        config.set('code_mode', codeMode);
        renderCodeMode(codeMode);
        return askPrompt();
      }

      // /system [text]
      if (input === '/system') {
        renderInfo('Current: ' + chalk.italic(config.get('system_prompt') || '(default)'));
        renderInfo('Set with: /system <your prompt>');
        return askPrompt();
      }
      if (input.startsWith('/system ')) {
        const msg = input.slice(8).trim();
        config.set('system_prompt', msg);
        renderSystem(`System prompt updated.`);
        return askPrompt();
      }

      // /limit
      if (input === '/limit') {
        if (!hasLimit) {
          renderInfo('No daily limit (using your own API key).');
        } else {
          const u = getUsage(limitKey);
          const pct = Math.round((u.used / u.total) * 100);
          renderInfo(`Prompts used: ${chalk.white.bold(u.used + '/' + u.total)} (${pct}%)  —  ${chalk.white.bold(u.remaining)} remaining today`);
        }
        return askPrompt();
      }

      // /resetlimit  — clears today's usage counter (useful after false-positive)
      if (input === '/resetlimit') {
        resetAllLimits();
        renderSystem('Daily limit counter reset to 0/65.');
        return askPrompt();
      }

      // /cekversion
      if (input === '/cekversion') {
        const spinner = ora({ text: chalk.hex('#888')('Checking version...'), spinner: 'dots', color: 'cyan' }).start();
        let latest = null;
        try { latest = await fetchLatestVersion(); } catch { /* ok */ }
        spinner.stop();
        renderVersionCheck(getCurrentVersion(), latest);
        return askPrompt();
      }

      // /update  /repair
      if (input === '/update') { await runUpdate(); return askPrompt(); }
      if (input === '/repair') { await runRepair(); return askPrompt(); }

      // ── Daily limit check (BEFORE sending, AFTER all slash commands) ──────
      if (hasLimit && !canSend(limitKey)) {
        const u = getUsage(limitKey);
        renderLimitReached(u.used, u.total, provider.name);
        // ← Stay in menu, do NOT exit
        return askPrompt();
      }

      // ── AI call ───────────────────────────────────────────────────────────
      chatHistory.push({ role: 'user', content: input });

      const spinner = ora({
        text:    chalk.hex('#555')('Thinking...'),
        spinner: 'dots2',
        color:   'magenta',
      }).start();

      try {
        const baseSystem = config.get('system_prompt') ||
          'You are Yuzz, a helpful and concise AI assistant in a terminal. Format responses clearly. Use markdown when helpful.';
        const systemPrompt = codeMode ? CODE_SYSTEM + '\n\n' + baseSystem : baseSystem;

        const response = await provider.chat(chatHistory, systemPrompt);
        spinner.stop();

        // Calc updated usage for display
        const u = getUsage(limitKey);
        renderResponseHeader(provider.model, hasLimit ? u.used : null, hasLimit ? u.total : null);

        const rendered = marked(response);
        const indented = rendered.split('\n').map(l => '  ' + l).join('\n');
        process.stdout.write(indented + '\n');

        chatHistory.push({ role: 'assistant', content: response });
        saveHistory(chatHistory);

        // Increment AFTER successful response
        incrementUsage(limitKey);

        // Warn when close to limit
        const uAfter = getUsage(limitKey);
        if (hasLimit && uAfter.remaining > 0 && uAfter.remaining <= 5) {
          renderWarning(`Only ${chalk.white.bold(uAfter.remaining)} prompt(s) left today. Use /limit to check.`);
        }

      } catch (err) {
        spinner.stop();
        chatHistory.pop(); // roll back

        const msg = err.message || String(err);

        // Rate limit — stay in menu, friendly message
        if (msg === 'RATE_LIMIT') {
          renderWarning('Rate limit reached. Wait a moment and try again. (You are still in Yuzz)');
          return askPrompt();
        }

        renderError(msg);
        // ← Stay in menu
      }

      askPrompt();
    });
  };

  askPrompt();
}

main().catch(err => {
  renderError(String(err));
  process.exit(1);
});
