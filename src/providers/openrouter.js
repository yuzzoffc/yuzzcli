import fetch from 'node-fetch';
import chalk from 'chalk';

// Free models on OpenRouter
const FREE_MODELS = {
  'mistral':      'mistralai/mistral-7b-instruct:free',
  'llama3':       'meta-llama/llama-3.2-3b-instruct:free',
  'llama3-8b':    'meta-llama/llama-3.1-8b-instruct:free',
  'gemma':        'google/gemma-3-4b-it:free',
  'qwen':         'qwen/qwen-2.5-7b-instruct:free',
  'deepseek':     'deepseek/deepseek-r1:free',
  'phi3':         'microsoft/phi-3-mini-128k-instruct:free',
};

export class OpenRouterProvider {
  constructor(apiKey, modelOverride = null) {
    this.apiKey = apiKey;
    this.name = 'OpenRouter';
    this.model = modelOverride
      ? (FREE_MODELS[modelOverride] || modelOverride)
      : 'mistralai/mistral-7b-instruct:free';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  listModels() {
    console.log(chalk.hex('#B57BFF').bold('\n  Free Models on OpenRouter:\n'));
    const models = [
      { alias: 'mistral',   id: FREE_MODELS['mistral'],   note: '🌟 Mistral 7B (default)' },
      { alias: 'llama3',    id: FREE_MODELS['llama3'],    note: '🦙 Llama 3.2 3B' },
      { alias: 'llama3-8b', id: FREE_MODELS['llama3-8b'], note: '🦙 Llama 3.1 8B' },
      { alias: 'gemma',     id: FREE_MODELS['gemma'],     note: '💫 Google Gemma 4B' },
      { alias: 'qwen',      id: FREE_MODELS['qwen'],      note: '🐉 Qwen 2.5 7B' },
      { alias: 'deepseek',  id: FREE_MODELS['deepseek'],  note: '🔭 DeepSeek R1 (reasoning)' },
      { alias: 'phi3',      id: FREE_MODELS['phi3'],      note: '⚡ Microsoft Phi-3 Mini' },
    ];
    models.forEach(m => {
      const current = m.id === this.model ? chalk.green(' ◄ current') : '';
      console.log(
        `  ${chalk.cyan('--model=' + m.alias).padEnd(28)} ${chalk.gray(m.id.slice(0, 40)).padEnd(44)} ${chalk.hex('#888')(m.note)}${current}`
      );
    });
    console.log(chalk.gray('\n  Usage: yuzz --provider=openrouter --model=llama3\n'));
  }

  async chat(history, systemPrompt) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/yuzz-cli/yuzz',
        'X-Title': 'Yuzz CLI',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.9,
        max_tokens: 4096,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 401) throw new Error('Invalid OpenRouter API key.');
      if (res.status === 429) throw new Error('Rate limit reached. Wait a moment and try again.');
      throw new Error(`OpenRouter API error: ${errMsg}`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from OpenRouter. Try rephrasing your message.');

    return text;
  }
}
