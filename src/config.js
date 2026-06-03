import Conf from 'conf';

const store = new Conf({
  projectName: 'yuzz-cli',
  defaults: {
    provider: 'gemini',
    gemini_key: '',
    openrouter_key: '',
    system_prompt: '',
    save_history: true,
    max_history: 50,
  },
});

export const config = {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  getAll: () => store.store,
  path: store.path,
};
