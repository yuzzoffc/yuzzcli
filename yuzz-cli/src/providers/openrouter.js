import fetch from 'node-fetch';
import chalk from 'chalk';

// ── Built-in Dev key ──────────────────────────────────────────────────────────
// This shared key gives 65 prompts/day across all Yuzz users.
// After publishing to GitHub, replace this with your real key.
// The key is lightly obfuscated (base64) — NOT secret, just avoids scrapers.
//
// To get your own free key: https://openrouter.ai → Sign up → Keys → Create
const _B = 'c2stb3ItdjEtWVVaWkNMSUJVSUxUSU5LRVlIRVJFWVVaWkNMSQ==';
const BUILTIN_KEY = (() => {
  try { return Buffer.from(_B, 'base64').toString('utf-8').slice(0, 52); }
  catch { return ''; }
})();

// ── Free models ───────────────────────────────────────────────────────────────
export const FREE_MODELS = {
  'mistral':    'mistralai/mistral-7b-instruct:free',
  'llama3':     'meta-llama/llama-3.2-3b-instruct:free',
  'llama3-8b':  'meta-llama/llama-3.1-8b-instruct:free',
  'gemma':      'google/gemma-3-4b-it:free',
  'qwen':       'qwen/qwen-2.5-7b-instruct:free',
  'deepseek':   'deepseek/deepseek-r1:free',
  'phi3':       'microsoft/phi-3-mini-128k-instruct:free',
  'mythomax':   'gryphe/mythomax-l2-13b:free',
};

const DEFAULT_MODEL = FREE_MODELS['mistral'];

export class OpenRouterProvider {
  /**
   * @param {string|null} userKey  — null or '' = use built-in dev key
   * @param {string|null} modelOverride
   */
  constructor(userKey = null, modelOverride = null) {
    // isBuiltin = true when no personal key configured
    this.isBuiltin = !userKey;
    this.apiKey    = (userKey && userKey.trim()) ? userKey.trim() : BUILTIN_KEY;
    this.name      = this.isBuiltin ? 'OpenRouter (Built-in)' : 'OpenRouter';
    this.model     = modelOverride
      ? (FREE_MODELS[modelOverride] || modelOverride)
      : DEFAULT_MODEL;
    this.baseUrl   = 'https://openrouter.ai/api/v1';
  }

  listModels() {
    console.log(chalk.hex('#B57BFF').bold('\n  Free Models — OpenRouter:\n'));
    const list = [
      { alias: 'mistral',   note: '🌟 Mistral 7B (default)' },
      { alias: 'llama3',    note: '🦙 Llama 3.2 3B' },
      { alias: 'llama3-8b', note: '🦙 Llama 3.1 8B' },
      { alias: 'gemma',     note: '💫 Google Gemma 4B' },
      { alias: 'qwen',      note: '🐉 Qwen 2.5 7B' },
      { alias: 'deepseek',  note: '🔭 DeepSeek R1 (reasoning)' },
      { alias: 'phi3',      note: '⚡ Microsoft Phi-3 Mini' },
      { alias: 'mythomax',  note: '📖 MythoMax 13B' },
    ];
    list.forEach(m => {
      const id  = FREE_MODELS[m.alias];
      const cur = id === this.model ? chalk.hex('#44FF99')(' ◄ current') : '';
      console.log(
        `  ${chalk.hex('#00D9FF')(('model ' + m.alias).padEnd(18))}  ${chalk.hex('#555')(id.padEnd(46))}  ${chalk.hex('#888')(m.note)}${cur}`
      );
    });
    console.log(chalk.hex('#555')('\n  Switch model: yuzz model <alias>   e.g. yuzz model deepseek\n'));
  }

  async chat(history, systemPrompt) {
    // Safety: if built-in key is empty (obfuscation failed), tell the user clearly
    if (!this.apiKey) {
      throw new Error('No API key configured. Run: yuzz setkey openrouter <YOUR_KEY>\nGet free key at: https://openrouter.ai');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    let res;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer':  'https://github.com/yuzz-cli/yuzz',
          'X-Title':       'Yuzz CLI',
        },
        body: JSON.stringify({
          model:       this.model,
          messages,
          temperature: 0.85,
          max_tokens:  4096,
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      if (err.name === 'TimeoutError') throw new Error('Request timed out. Check your internet and try again.');
      throw new Error(`Network error: ${err.message}. Check your connection.`);
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Bad response from OpenRouter (status ${res.status}). Try again.`);
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 401) {
        if (this.isBuiltin) throw new Error('Built-in key rejected. Run: yuzz repair\nOr add your own key: yuzz setkey openrouter <KEY>');
        throw new Error('Invalid OpenRouter key. Run: yuzz setkey openrouter <KEY>');
      }
      if (res.status === 402) throw new Error('Insufficient credits. Try a different model: yuzz model mistral');
      if (res.status === 429) throw new Error('RATE_LIMIT');
      if (res.status === 503) throw new Error('OpenRouter is temporarily unavailable. Try again in a moment.');
      throw new Error(`OpenRouter error: ${errMsg}`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      const finishReason = data?.choices?.[0]?.finish_reason;
      if (finishReason === 'content_filter') throw new Error('Response blocked by content filter. Try rephrasing.');
      throw new Error('Empty response received. Try rephrasing your message.');
    }

    return text;
  }
}
