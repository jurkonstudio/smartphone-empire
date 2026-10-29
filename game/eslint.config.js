// ESLint flat config (longgar, Tahap 4). Hanya bug nyata yang menjadi error.
// no-empty sengaja dimatikan dulu (dikerjakan di Tahap 7).
import globals from 'globals';

const serviceWorkerGlobals = {
  self: 'readonly', caches: 'readonly', clients: 'readonly', Response: 'readonly',
  Request: 'readonly', fetch: 'readonly', URL: 'readonly', console: 'readonly',
  Promise: 'readonly', Headers: 'readonly', location: 'readonly'
};

const rules = {
  'no-undef': 'error',
  'no-unreachable': 'error',
  'no-dupe-keys': 'error',
  'no-redeclare': 'error',
  'no-unused-vars': 'warn',
  'no-empty': 'off'
};

export default [
  { ignores: ['node_modules/**', 'dist/**', '031411/**', '_diff/**', '**/*.probe.js'] },
  {
    // Game (browser). THREE dan supabase dimuat dari CDN sebagai global.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, THREE: 'readonly', supabase: 'readonly' }
    },
    rules
  },
  {
    // Skrip uji dan alat (Node).
    files: ['tools/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules
  },
  {
    // Service worker: global SW saja, jangan campur dengan globals browser src/.
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: serviceWorkerGlobals },
    rules
  }
];
