import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';

// ─────────────────────────────────────────────
//  BRAND GRADIENT
// ─────────────────────────────────────────────
const yuzzGrad = gradient(['#B57BFF', '#00D9FF']);
const warmGrad = gradient(['#FF6B6B', '#FFD93D']);

// ─────────────────────────────────────────────
//  WELCOME BANNER
// ─────────────────────────────────────────────
export function renderWelcome(providerName, modelName) {
  console.clear();

  const logo = [
    '  ██╗   ██╗██╗   ██╗███████╗███████╗',
    '  ╚██╗ ██╔╝██║   ██║╚══███╔╝╚══███╔╝',
    '   ╚████╔╝ ██║   ██║  ███╔╝   ███╔╝ ',
    '    ╚██╔╝  ██║   ██║ ███╔╝   ███╔╝  ',
    '     ██║   ╚██████╔╝███████╗███████╗',
    '     ╚═╝    ╚═════╝ ╚══════╝╚══════╝',
  ].join('\n');

  console.log('\n' + yuzzGrad(logo));

  console.log(
    boxen(
      chalk.hex('#888888')('AI Terminal Chat  •  ') +
      chalk.hex('#00D9FF')(providerName) +
      chalk.hex('#888888')('  •  ') +
      chalk.hex('#B57BFF')(modelName) +
      chalk.hex('#888888')('\n\n  Type ') +
      chalk.white('/help') +
      chalk.hex('#888888')(' for commands  •  ') +
      chalk.white('Ctrl+C') +
      chalk.hex('#888888')(' or ') +
      chalk.white('/exit') +
      chalk.hex('#888888')(' to quit'),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 1, left: 2, right: 0 },
        borderStyle: 'round',
        borderColor: '#444444',
        dimBorder: true,
      }
    )
  );
}

// ─────────────────────────────────────────────
//  HELP
// ─────────────────────────────────────────────
export function renderHelp() {
  const title = yuzzGrad('  Yuzz CLI — Commands\n');

  const commands = [
    ['/help',                 'Show this help'],
    ['/clear',               'Clear screen & reset chat'],
    ['/history',             'Show conversation history'],
    ['/models',              'List available AI models'],
    ['/system <prompt>',     'Set custom system prompt'],
    ['/exit or /quit',       'Exit Yuzz'],
    ['',                     ''],
    ['yuzz set-key gemini <KEY>',       'Save Gemini API key'],
    ['yuzz set-key openrouter <KEY>',   'Save OpenRouter API key'],
    ['yuzz config',                     'Show current config'],
    ['yuzz clear-history',              'Clear saved history'],
    ['yuzz --model=flash',              'Use specific model'],
    ['yuzz --provider=openrouter',      'Use OpenRouter provider'],
    ['yuzz --help',                     'Show CLI flags'],
  ];

  const rows = commands.map(([cmd, desc]) => {
    if (!cmd) return '';
    return `  ${chalk.cyan(cmd.padEnd(36))} ${chalk.hex('#CCCCCC')(desc)}`;
  }).join('\n');

  console.log(
    boxen(
      title + '\n' + rows + '\n\n' +
      chalk.gray('  Free API Keys:\n') +
      chalk.hex('#888')('  Gemini    → ') + chalk.cyan.underline('https://aistudio.google.com/app/apikey') + '\n' +
      chalk.hex('#888')('  OpenRouter→ ') + chalk.cyan.underline('https://openrouter.ai'),
      {
        padding: 1,
        margin: { left: 1 },
        borderStyle: 'round',
        borderColor: '#B57BFF',
      }
    )
  );
}

// ─────────────────────────────────────────────
//  ERROR
// ─────────────────────────────────────────────
export function renderError(msg) {
  console.log(
    '\n' + boxen(
      chalk.red.bold('✖  Error\n\n') + chalk.hex('#FF8888')(msg),
      {
        padding: 1,
        margin: { left: 2 },
        borderStyle: 'round',
        borderColor: 'red',
      }
    ) + '\n'
  );
}

// ─────────────────────────────────────────────
//  SYSTEM MESSAGE
// ─────────────────────────────────────────────
export function renderSystem(msg) {
  console.log(
    '\n  ' + chalk.hex('#FFD93D')('◈  ') + chalk.hex('#FFD93D')(msg) + '\n'
  );
}
