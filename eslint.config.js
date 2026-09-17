import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { '@typescript-eslint/consistent-type-imports': 'error' },
  },
  // `npm run lint` also names scripts/. Its PowerShell tooling has no lintable
  // sources at all, and ESLint 10 exits 2 when a named pattern matches no file,
  // so scripts/matrix.ts is the real typed helper that keeps the folder
  // lintable. The capture harness beside it is plain .mjs: the type-checked
  // rules cannot apply to a file no tsconfig includes, so those two patterns
  // are skipped and everything else stays under the strict config above.
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'output/**',
      'coverage/**',
      '.shots/**',
      'scripts/**/*.mjs',
      'scripts/**/*.js',
      'eslint.config.js',
    ],
  },
);
