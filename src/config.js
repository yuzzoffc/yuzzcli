import Conf from 'conf';

const store = new Conf({
  projectName: 'yuzz-cli',
  defaults: {
    provider:        'openrouter',   // default = built-in OpenRouter
    gemini_key:      '',
    openrouter_key:  '',             // empty = use built-in dev key
    model_openrouter: '',            // user-chosen OR model alias
    model_gemini:    '',             // user-chosen Gemini model alias
    system_prompt:   '',
    code_mode:       false,          // code generator mode
    save_history:    true,
    max_history:     50,
  },
});

export const config = {
  get:    (key)        => store.get(key),
  set:    (key, value) => store.set(key, value),
  getAll: ()           => store.store,
  path:   store.path,
};
