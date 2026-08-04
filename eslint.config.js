import js from '@eslint/js'
import globals from 'globals'

// Flat config, required by ESLint 9. This replaces the old .eslintrc.js, which
// ESLint 9 does not read (and which could not have been loaded anyway: it used
// module.exports inside a "type": "module" package).
export default [
  {
    ignores: ['_site/**', '.cache/**', 'node_modules/**', 'src/static/**']
  },
  {
    // Scoped to the CLI scripts and tests for now. config/ and
    // eleventy.config.js are written with 4-space indentation throughout and
    // would need a separate mechanical reformat (~500 findings) before they can
    // be linted; src/ is mostly WebC/Liquid templates and browser bundles.
    files: ['scripts/**/*.{js,mjs}', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'comma-dangle': ['error', 'never']
    }
  }
]
