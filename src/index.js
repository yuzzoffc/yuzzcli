#!/usr/bin/env node

import chalk from 'chalk';
import readline from 'readline';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { createRequire } from 'module';
import { config } from './config.js';
import { GeminiProvider } from './providers/gemini.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { renderWelcome, renderHelp, renderError, renderSystem } from './ui.js';
import { history, saveHistory, loadHistory } from './history.js';

const require = createRequire(import.meta.url);

// Setup marked with terminal renderer
marked.use(markedTerminal({
  code: chalk.hex('#00D9FF'),
  codespan: chalk.hex('#00D9FF').bold,
  heading: chalk.hex('#B57BFF').bold,
  firstHeading: chalk.hex('#B57BFF').bold,
  strong: chalk.white.bold,
  em: chalk.italic,
  blockquote: chalk.hex('#888888').italic,
  listitem: chalk.hex('#E0E0E0'),
}));

// ─────────────────────────────────────────────
//  CLI ARGS
// ─────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
  config: args.includes('config'),
  setKey: args.includes('set-key'),
  clearHistory: args.includes('clear-history'),
  model: args.find(a => a.startsWith('--model='))?.split('=')[1],
  provider: args.find(a => a.startsWith('--provider='))?.split('=')[1],
};

// ─────────────────────────────────────────────
//  HANDLE FLAGS
// ─────────────────────────────────────────────
if (flags.version) {
  console.log(gradient.pastel('Yuzz CLI v1.0.0'));
  process.exit(0);
}

if (flags.help) {
  renderHelp();
  process.exit(0);
}

if (flags.config) {
  const cfg = config.getAll();
  console.log(boxen(
    chalk.hex('#B57BFF').bold('⚙  Current Config\n\n') +
    Object.entries(cfg).map(([k, v]) => {
      const val = k.includes('key') ? (v ? chalk.green('✓ Set') : chalk.red('✗ Not set')) : chalk.cyan(v);
      return `  ${chalk.gray(k.padEnd(20))} ${val}`;
    }).join('\n'),
    { padding: 1, borderColor: '#B57BFF', borderStyle: 'round' }
  ));
  process.exit(0);
}

if (flags.clearHistory) {
  saveHistory([]);
  renderSystem('Chat history cleared!');
  process.exit(0);
}

// Handle: yuzz set-key <provider> <key>
if (flags.setKey) {
  const provider = args[1];
  const key = args[2];
  if (!provider || !key) {
    renderError('Usage: yuzz set-key <gemini|openrouter> <YOUR_API_KEY>');
    process.exit(1);
  }
  config.set(`${provider}_key`, key);
  renderSystem(`✓ API key for ${chalk.cyan(provider)} saved!`);
  process.exit(0);
}

// ─────────────────────────────────────────────
//  MAIN CHAT LOOP
// ─────────────────────────────────────────────
async function main() {
  const providerName = flags.provider || config.get('provider') || 'gemini';
  const modelOverride = flags.model;

  // Resolve provider
  let provider;
  if (providerName === 'openrouter') {
    const key = config.get('openrouter_key');
    if (!key) {
      renderError('OpenRouter key not set. Run: yuzz set-key openrouter <YOUR_KEY>');
      renderSystem('Get a free key at https://openrouter.ai');
      process.exit(1);
    }
    provider = new OpenRouterProvider(key, modelOverride);
  } else {
    // Default: Gemini
    const key = config.get('gemini_key');
    if (!key) {
      renderError('Gemini API key not set.');
      console.log(
        boxen(
          chalk.yellow.bold('🔑  Quick Setup\n\n') +
          chalk.white('1. Get a FREE key at:\n') +
          chalk.cyan.underline('   https://aistudio.google.com/app/apikey\n\n') +
          chalk.white('2. Then run:\n') +
          chalk.green('   yuzz set-key gemini YOUR_API_KEY\n\n') +
          chalk.gray('Alternative (also free):\n') +
          chalk.white('   yuzz set-key openrouter YOUR_KEY\n') +
          chalk.gray('   https://openrouter.ai'),
          { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
        )
      );
      process.exit(1);
    }
    provider = new GeminiProvider(key, modelOverride);
  }

  renderWelcome(provider.name, provider.model);

  const chatHistory = loadHistory();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // Graceful exit
  rl.on('close', () => {
    saveHistory(chatHistory);
    console.log('\n' + chalk.hex('#888888')('  Goodbye! 👋\n'));
    process.exit(0);
  });

  process.on('SIGINT', () => {
    rl.close();
  });

  const prompt = () => {
    const p = chalk.hex('#00D9FF').bold(' ❯ ') + chalk.white('');
    rl.question(p, async (input) => {
      input = input.trim();

      if (!input) return prompt();

      // Built-in commands
      if (input === '/exit' || input === '/quit') {
        rl.close();
        return;
      }

      if (input === '/clear') {
        console.clear();
        renderWelcome(provider.name, provider.model);
        chatHistory.length = 0;
        return prompt();
      }

      if (input === '/history') {
        if (chatHistory.length === 0) {
          renderSystem('No history yet.');
        } else {
          chatHistory.forEach((m, i) => {
            const role = m.role === 'user'
              ? chalk.hex('#00D9FF').bold('You')
              : chalk.hex('#B57BFF').bold('Yuzz');
            const content = m.content.length > 80 ? m.content.slice(0, 80) + '...' : m.content;
            console.log(chalk.gray(`  ${(i + 1).toString().padStart(2, '0')}`) + ` ${role}: ${chalk.gray(content)}`);
          });
        }
        return prompt();
      }

      if (input === '/help') {
        renderHelp();
        return prompt();
      }

      if (input === '/models') {
        provider.listModels();
        return prompt();
      }

      if (input.startsWith('/system ')) {
        const sysMsg = input.slice(8).trim();
        config.set('system_prompt', sysMsg);
        renderSystem(`System prompt updated: "${chalk.italic(sysMsg)}"`);
        return prompt();
      }

      // Add user message to history
      chatHistory.push({ role: 'user', content: input });

      // Spinner
      const spinner = ora({
        text: chalk.hex('#888888')('Thinking...'),
        spinner: 'dots',
        color: 'magenta',
      }).start();

      try {
        const systemPrompt = config.get('system_prompt') ||
          'You are Yuzz, a helpful, concise, and friendly AI assistant running in a terminal. Format responses clearly. Use markdown when helpful.';

        const response = await provider.chat(chatHistory, systemPrompt);

        spinner.stop();

        // Render AI response
        const aiLabel = chalk.hex('#B57BFF').bold('  ◆ Yuzz') + chalk.gray(` (${provider.model})`);
        console.log('\n' + aiLabel);
        console.log(chalk.gray('  ' + '─'.repeat(50)));

        // Render markdown
        const rendered = marked(response);
        const indented = rendered.split('\n').map(l => '  ' + l).join('\n');
        console.log(indented);

        chatHistory.push({ role: 'assistant', content: response });
        saveHistory(chatHistory);

      } catch (err) {
        spinner.stop();
        renderError(err.message || 'Unknown error occurred');
      }

      prompt();
    });
  };

  prompt();
}

main().catch(err => {
  renderError(err.message);
  process.exit(1);
});
