import fetch from 'node-fetch';
import chalk from 'chalk';

const GEMINI_MODELS = {
  'flash': 'gemini-2.0-flash',
  'flash-lite': 'gemini-2.0-flash-lite',
  'flash-thinking': 'gemini-2.0-flash-thinking-exp',
  'pro': 'gemini-1.5-pro',
  '1.5-flash': 'gemini-1.5-flash',
};

export class GeminiProvider {
  constructor(apiKey, modelOverride = null) {
    this.apiKey = apiKey;
    this.name = 'Google Gemini';
    this.model = modelOverride
      ? (GEMINI_MODELS[modelOverride] || modelOverride)
      : 'gemini-2.0-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  listModels() {
    const { renderSystem } = require('../ui.js');
    console.log(chalk.hex('#B57BFF').bold('\n  Available Gemini Models (Free Tier):\n'));
    const models = [
      { alias: 'flash',          id: 'gemini-2.0-flash',                  note: '⚡ Fast & capable (default)' },
      { alias: 'flash-lite',     id: 'gemini-2.0-flash-lite',             note: '🪶 Ultra-fast, lightweight' },
      { alias: 'flash-thinking', id: 'gemini-2.0-flash-thinking-exp',     note: '🧠 Reasoning model (experimental)' },
      { alias: 'pro',            id: 'gemini-1.5-pro',                    note: '💎 Pro model' },
      { alias: '1.5-flash',      id: 'gemini-1.5-flash',                  note: '⚡ 1.5 Flash' },
    ];
    models.forEach(m => {
      const current = m.id === this.model ? chalk.green(' ◄ current') : '';
      console.log(
        `  ${chalk.cyan('--model=' + m.alias).padEnd(32)} ${chalk.gray(m.id).padEnd(48)} ${chalk.hex('#888')(m.note)}${current}`
      );
    });
    console.log(chalk.gray('\n  Usage: yuzz --model=flash\n'));
  }

  // Convert chat history to Gemini format
  _formatMessages(history, systemPrompt) {
    const contents = [];

    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    return { contents, systemPrompt };
  }

  async chat(history, systemPrompt) {
    const { contents } = this._formatMessages(history, systemPrompt);

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 400 && errMsg.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key. Check with: yuzz config');
      }
      if (res.status === 429) {
        throw new Error('Rate limit reached. Wait a moment and try again.');
      }
      throw new Error(`Gemini API error: ${errMsg}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason;
      if (reason === 'SAFETY') throw new Error('Response blocked by safety filters.');
      throw new Error('No response from Gemini. Try rephrasing your message.');
    }

    return text;
  }
}
