import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Context providers necessarily export their matching hook alongside the
    // component. Splitting them into two files would force every consumer to
    // import from two places and would not change how fast refresh behaves,
    // since the hook holds no component state of its own.
    files: ['**/context/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
