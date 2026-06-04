import fetch from 'node-fetch';
import chalk from 'chalk';

const GEMINI_MODELS = {
  'flash':          'gemini-2.0-flash',
  'flash-lite':     'gemini-2.0-flash-lite',
  'flash-thinking': 'gemini-2.0-flash-thinking-exp',
  'pro':            'gemini-1.5-pro',
  '1.5-flash':      'gemini-1.5-flash',
};

export class GeminiProvider {
  constructor(apiKey, modelOverride = null) {
    this.apiKey  = apiKey;
    this.name    = 'Google Gemini';
    this.model   = modelOverride
      ? (GEMINI_MODELS[modelOverride] || modelOverride)
      : 'gemini-2.0-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  listModels() {
    console.log(chalk.hex('#B57BFF').bold('\n  Models — Google Gemini (Free Tier):\n'));
    const models = [
      { alias: 'flash',          id: 'gemini-2.0-flash',              note: '⚡ Default, fast & capable' },
      { alias: 'flash-lite',     id: 'gemini-2.0-flash-lite',         note: '🪶 Ultra-fast' },
      { alias: 'flash-thinking', id: 'gemini-2.0-flash-thinking-exp', note: '🧠 Reasoning (experimental)' },
      { alias: 'pro',            id: 'gemini-1.5-pro',                note: '💎 Pro model' },
      { alias: '1.5-flash',      id: 'gemini-1.5-flash',              note: '⚡ 1.5 Flash' },
    ];
    models.forEach(m => {
      const cur = m.id === this.model ? chalk.hex('#44FF99')(' ◄ current') : '';
      console.log(
        `  ${chalk.hex('#00D9FF')(('model ' + m.alias).padEnd(18))}  ${chalk.hex('#555')(m.id.padEnd(40))}  ${chalk.hex('#888')(m.note)}${cur}`
      );
    });
    console.log(chalk.hex('#555')('\n  Usage: yuzz gemini model flash\n'));
  }

  _formatHistory(history) {
    return history.map(msg => ({
      role:  msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  async chat(history, systemPrompt) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    let res;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contents: this._formatHistory(history),
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig:  { temperature: 0.85, topP: 0.95, maxOutputTokens: 8192 },
        }),
      });
    } catch (networkErr) {
      throw new Error(`Network error: ${networkErr.message}. Check your connection.`);
    }

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 400 && errMsg.toLowerCase().includes('api key'))
        throw new Error('Invalid Gemini API key. Run: yuzz setkey gemini <KEY>');
      if (res.status === 403)
        throw new Error('API key lacks permission. Check key at aistudio.google.com');
      if (res.status === 429)
        throw new Error('RATE_LIMIT');
      throw new Error(`Gemini: ${errMsg}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason;
      if (reason === 'SAFETY')     throw new Error('Response blocked by safety filters. Try rephrasing.');
      if (reason === 'MAX_TOKENS') throw new Error('Response truncated. Try a shorter question.');
      throw new Error('Empty response. Try rephrasing.');
    }

    return text;
  }
}
